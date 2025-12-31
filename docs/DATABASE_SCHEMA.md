# Lightsail Database Schema Documentation

## Overview

Lightsail uses PostgreSQL as its primary database with a multi-tenant architecture. All tenant-scoped tables include an `organization_id` column for data isolation, enforced through Row Level Security (RLS) policies.

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  organizations  │──────<│      users      │       │   frameworks    │
└────────┬────────┘       └─────────────────┘       └────────┬────────┘
         │                                                    │
         │  ┌─────────────────────────────────────────────────┤
         │  │                                                 │
         ▼  ▼                                                 ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    controls     │──────<│control_framework│>──────│framework_reqs   │
└────────┬────────┘       │    _mappings    │       └─────────────────┘
         │                └─────────────────┘
         │
         │  ┌─────────────────┐
         ├─<│    evidence     │
         │  └─────────────────┘
         │
         │  ┌─────────────────┐
         └─<│     tasks       │
            └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│   integrations  │──────<│ integration_logs│
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│    policies     │──────<│policy_versions  │
└─────────────────┘       └─────────────────┘

┌─────────────────┐
│   audit_logs    │  (Standalone - tracks all changes)
└─────────────────┘
```

## Core Tables

### organizations

The root entity for multi-tenancy. All other tenant-scoped data references this table.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,

  -- Subscription & Billing
  plan VARCHAR(50) NOT NULL DEFAULT 'trial',  -- trial, starter, professional, enterprise
  plan_started_at TIMESTAMP,
  trial_ends_at TIMESTAMP,

  -- Organization Details
  industry VARCHAR(100),
  employee_count VARCHAR(50),  -- 1-10, 11-50, 51-200, 201-500, 500+
  country VARCHAR(2),  -- ISO country code
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Settings
  settings JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP  -- Soft delete
);

CREATE UNIQUE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;
```

### users

User accounts linked to Clerk authentication.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,  -- Clerk user ID
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,

  -- Preferences
  preferences JSONB DEFAULT '{}',

  -- Metadata
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
```

### organization_members

Junction table linking users to organizations with roles.

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Role & Permissions
  role VARCHAR(50) NOT NULL DEFAULT 'member',  -- owner, admin, member, viewer

  -- Invitation tracking
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP,
  accepted_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
```

## Compliance Framework Tables

### frameworks

Compliance frameworks supported by the platform (seeded data).

```sql
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,  -- SOC2, ISO27001, GDPR, NDPR
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50),

  -- Framework metadata
  category VARCHAR(100),  -- security, privacy, regional
  regions TEXT[],  -- Applicable regions: ['US', 'UK', 'NG', 'EU']

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Initial frameworks
INSERT INTO frameworks (code, name, description, category, regions) VALUES
  ('SOC2', 'SOC 2', 'Service Organization Control 2', 'security', ARRAY['US', 'UK', 'GLOBAL']),
  ('ISO27001', 'ISO 27001', 'Information Security Management System', 'security', ARRAY['GLOBAL']),
  ('GDPR', 'GDPR', 'General Data Protection Regulation', 'privacy', ARRAY['EU', 'UK']),
  ('NDPR', 'NDPR', 'Nigeria Data Protection Regulation', 'privacy', ARRAY['NG']);
```

### framework_requirements

Individual requirements within each framework (seeded data).

```sql
CREATE TABLE framework_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id),

  -- Requirement identification
  code VARCHAR(100) NOT NULL,  -- CC1.1, A.5.1, Art.5
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Hierarchy
  parent_id UUID REFERENCES framework_requirements(id),
  category VARCHAR(100),  -- Trust Services Category, Annex A Domain, etc.

  -- Guidance
  guidance TEXT,
  implementation_guidance TEXT,

  -- Metadata
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(framework_id, code)
);

CREATE INDEX idx_framework_reqs_framework ON framework_requirements(framework_id);
CREATE INDEX idx_framework_reqs_parent ON framework_requirements(parent_id);
```

### organization_frameworks

Tracks which frameworks an organization is pursuing compliance with.

```sql
CREATE TABLE organization_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  framework_id UUID NOT NULL REFERENCES frameworks(id),

  -- Status
  status VARCHAR(50) DEFAULT 'active',  -- active, paused, completed, archived
  target_date DATE,
  completed_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, framework_id)
);

CREATE INDEX idx_org_frameworks_org ON organization_frameworks(organization_id);
```

## Controls Tables

### controls

Compliance controls owned by organizations.

```sql
CREATE TABLE controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Control identification
  code VARCHAR(100),  -- Organization-defined control code
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Implementation details
  implementation_status VARCHAR(50) DEFAULT 'not_started',
    -- not_started, in_progress, implemented, not_applicable
  implementation_notes TEXT,

  -- Ownership
  owner_id UUID REFERENCES users(id),

  -- Risk assessment
  risk_level VARCHAR(50),  -- low, medium, high, critical

  -- Automation
  is_automated BOOLEAN DEFAULT false,
  automation_source VARCHAR(100),  -- aws, github, manual, etc.

  -- Review tracking
  last_reviewed_at TIMESTAMP,
  next_review_at TIMESTAMP,
  review_frequency_days INTEGER DEFAULT 90,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_controls_org ON controls(organization_id);
CREATE INDEX idx_controls_status ON controls(organization_id, implementation_status);
CREATE INDEX idx_controls_owner ON controls(owner_id);
```

### control_framework_mappings

Maps organization controls to framework requirements.

```sql
CREATE TABLE control_framework_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  framework_requirement_id UUID NOT NULL REFERENCES framework_requirements(id),

  -- Mapping metadata
  coverage VARCHAR(50) DEFAULT 'full',  -- full, partial, minimal
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(control_id, framework_requirement_id)
);

CREATE INDEX idx_cfm_control ON control_framework_mappings(control_id);
CREATE INDEX idx_cfm_requirement ON control_framework_mappings(framework_requirement_id);
```

## Evidence Tables

### evidence

Evidence collected for compliance controls.

```sql
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Evidence identification
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Type and source
  type VARCHAR(50) NOT NULL,  -- document, screenshot, log, config, report
  source VARCHAR(100),  -- manual, aws, github, gsuite, etc.

  -- File information
  file_key TEXT,  -- S3/R2 key
  file_name VARCHAR(255),
  file_size INTEGER,
  file_type VARCHAR(100),

  -- Collection metadata
  collected_at TIMESTAMP DEFAULT NOW(),
  collected_by UUID REFERENCES users(id),
  integration_id UUID REFERENCES integrations(id),

  -- Validity period
  valid_from DATE,
  valid_until DATE,

  -- Review status
  review_status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_evidence_org ON evidence(organization_id);
CREATE INDEX idx_evidence_source ON evidence(organization_id, source);
CREATE INDEX idx_evidence_collected ON evidence(organization_id, collected_at);
```

### evidence_control_links

Links evidence to controls (many-to-many).

```sql
CREATE TABLE evidence_control_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,

  -- Link metadata
  relevance VARCHAR(50) DEFAULT 'primary',  -- primary, supporting
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(evidence_id, control_id)
);

CREATE INDEX idx_ecl_evidence ON evidence_control_links(evidence_id);
CREATE INDEX idx_ecl_control ON evidence_control_links(control_id);
```

## Policy Tables

### policies

Policy documents managed by organizations.

```sql
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Policy identification
  code VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Categorization
  category VARCHAR(100),  -- security, hr, it, privacy, etc.

  -- Status
  status VARCHAR(50) DEFAULT 'draft',  -- draft, review, approved, archived

  -- Ownership
  owner_id UUID REFERENCES users(id),

  -- Approval tracking
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,

  -- Review schedule
  last_reviewed_at TIMESTAMP,
  next_review_at TIMESTAMP,
  review_frequency_days INTEGER DEFAULT 365,

  -- AI generation tracking
  is_ai_generated BOOLEAN DEFAULT false,
  ai_template_id VARCHAR(100),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_policies_org ON policies(organization_id);
CREATE INDEX idx_policies_status ON policies(organization_id, status);
CREATE INDEX idx_policies_category ON policies(organization_id, category);
```

### policy_versions

Version history for policies.

```sql
CREATE TABLE policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,

  -- Version tracking
  version INTEGER NOT NULL,

  -- Content
  content TEXT NOT NULL,  -- Markdown content

  -- File reference (for PDF exports)
  file_key TEXT,

  -- Change tracking
  change_summary TEXT,
  created_by UUID REFERENCES users(id),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(policy_id, version)
);

CREATE INDEX idx_policy_versions_policy ON policy_versions(policy_id);
```

### policy_control_links

Links policies to controls.

```sql
CREATE TABLE policy_control_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(policy_id, control_id)
);

CREATE INDEX idx_pcl_policy ON policy_control_links(policy_id);
CREATE INDEX idx_pcl_control ON policy_control_links(control_id);
```

## Integration Tables

### integrations

Third-party service integrations.

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Integration type
  type VARCHAR(100) NOT NULL,  -- aws, github, gsuite, azure_ad, jira, slack
  name VARCHAR(255) NOT NULL,  -- User-friendly name

  -- Connection status
  status VARCHAR(50) DEFAULT 'pending',  -- pending, active, error, disconnected
  error_message TEXT,

  -- Encrypted credentials
  credentials_encrypted TEXT NOT NULL,

  -- Configuration
  config JSONB DEFAULT '{}',  -- Type-specific config (regions, repos, etc.)

  -- Sync tracking
  last_sync_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  sync_frequency_minutes INTEGER DEFAULT 60,

  -- Connected by
  connected_by UUID REFERENCES users(id),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_integrations_org ON integrations(organization_id);
CREATE INDEX idx_integrations_type ON integrations(organization_id, type);
CREATE INDEX idx_integrations_status ON integrations(status);
```

### integration_logs

Logs for integration sync operations.

```sql
CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,

  -- Log details
  operation VARCHAR(100) NOT NULL,  -- sync, test_connection, collect_evidence
  status VARCHAR(50) NOT NULL,  -- started, success, failed

  -- Results
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB DEFAULT '{}',

  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER
);

CREATE INDEX idx_integration_logs_integration ON integration_logs(integration_id);
CREATE INDEX idx_integration_logs_started ON integration_logs(started_at);
```

## Task Management Tables

### tasks

Compliance tasks and remediation items.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Task details
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Type and priority
  type VARCHAR(50) DEFAULT 'general',  -- general, remediation, review, implementation
  priority VARCHAR(50) DEFAULT 'medium',  -- low, medium, high, critical

  -- Status
  status VARCHAR(50) DEFAULT 'open',  -- open, in_progress, blocked, completed, cancelled

  -- Assignment
  assignee_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),

  -- Dates
  due_date DATE,
  completed_at TIMESTAMP,

  -- Related entities
  control_id UUID REFERENCES controls(id),
  policy_id UUID REFERENCES policies(id),

  -- Metadata
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_tasks_org ON tasks(organization_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(organization_id, status);
CREATE INDEX idx_tasks_due ON tasks(organization_id, due_date);
CREATE INDEX idx_tasks_control ON tasks(control_id);
```

### task_comments

Comments on tasks.

```sql
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- Comment content
  content TEXT NOT NULL,

  -- Author
  author_id UUID NOT NULL REFERENCES users(id),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_task_comments_task ON task_comments(task_id);
```

## Audit & Analytics Tables

### audit_logs

Comprehensive audit trail for all sensitive operations.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),  -- NULL for system-level events

  -- Actor
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),

  -- Action details
  action VARCHAR(100) NOT NULL,  -- create, update, delete, login, export, etc.
  entity_type VARCHAR(100) NOT NULL,  -- control, evidence, policy, user, etc.
  entity_id UUID,

  -- Change tracking
  changes JSONB,  -- { field: { old: value, new: value } }

  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Partitioned by month for performance
CREATE INDEX idx_audit_logs_org_time ON audit_logs(organization_id, created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

### compliance_scores

Pre-calculated compliance scores (updated by background jobs).

```sql
CREATE TABLE compliance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  framework_id UUID REFERENCES frameworks(id),  -- NULL for overall score

  -- Scores (0-100)
  overall_score DECIMAL(5,2),
  control_coverage DECIMAL(5,2),
  evidence_coverage DECIMAL(5,2),
  policy_coverage DECIMAL(5,2),

  -- Breakdown
  controls_total INTEGER DEFAULT 0,
  controls_implemented INTEGER DEFAULT 0,
  controls_in_progress INTEGER DEFAULT 0,
  controls_not_started INTEGER DEFAULT 0,

  evidence_total INTEGER DEFAULT 0,
  evidence_valid INTEGER DEFAULT 0,
  evidence_expiring INTEGER DEFAULT 0,
  evidence_expired INTEGER DEFAULT 0,

  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, framework_id)
);

CREATE INDEX idx_compliance_scores_org ON compliance_scores(organization_id);
```

## Row Level Security Policies

All tenant-scoped tables must have RLS policies:

```sql
-- Enable RLS on all tenant tables
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Example policy for controls table
CREATE POLICY controls_isolation ON controls
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- Application sets the context on each request
SET app.current_organization_id = 'org-uuid-here';
```

## Indexing Strategy

### Primary Indexes
- All primary keys (auto-indexed)
- All foreign keys
- `organization_id` on all tenant-scoped tables (critical for multi-tenancy)

### Secondary Indexes
- Status columns frequently used in filters
- Date columns used for sorting/filtering
- Email and slug columns for lookups

### Composite Indexes
```sql
-- Common query patterns
CREATE INDEX idx_controls_org_status ON controls(organization_id, implementation_status);
CREATE INDEX idx_evidence_org_source_date ON evidence(organization_id, source, collected_at);
CREATE INDEX idx_tasks_org_status_due ON tasks(organization_id, status, due_date);
```

## Data Migration Strategy

### Schema Migrations
- Use Prisma migrations for schema changes
- Always include rollback scripts
- Test migrations on staging before production

### Data Migrations
```typescript
// migrations/20240101_example.ts
export async function up(prisma: PrismaClient) {
  // Forward migration
  await prisma.$executeRaw`
    UPDATE controls
    SET implementation_status = 'not_started'
    WHERE implementation_status IS NULL
  `;
}

export async function down(prisma: PrismaClient) {
  // Rollback if needed
}
```

## Backup Strategy

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Full backup | Daily | 30 days |
| Point-in-time | Continuous | 7 days |
| Long-term archive | Weekly | 1 year |

## Query Patterns

### Always Include Organization Context
```typescript
// CORRECT: Always filter by organization
const controls = await prisma.control.findMany({
  where: {
    organizationId: req.organizationId,  // REQUIRED
    implementationStatus: 'implemented'
  }
});

// WRONG: Never query without organization filter
const controls = await prisma.control.findMany({
  where: { implementationStatus: 'implemented' }  // SECURITY RISK!
});
```

### Pagination Pattern
```typescript
const { page = 1, pageSize = 20 } = req.query;
const skip = (page - 1) * pageSize;

const [controls, total] = await Promise.all([
  prisma.control.findMany({
    where: { organizationId: req.organizationId },
    skip,
    take: pageSize,
    orderBy: { createdAt: 'desc' }
  }),
  prisma.control.count({
    where: { organizationId: req.organizationId }
  })
]);

return {
  data: controls,
  meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
};
```

### Soft Delete Pattern
```typescript
// Delete (soft)
await prisma.control.update({
  where: { id: controlId },
  data: { deletedAt: new Date() }
});

// Always exclude deleted records
const controls = await prisma.control.findMany({
  where: {
    organizationId: req.organizationId,
    deletedAt: null  // IMPORTANT
  }
});
```
