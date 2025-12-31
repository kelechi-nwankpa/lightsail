# Lightsail - Compliance Automation SaaS

## Quick Reference

| Category | Technology |
|----------|------------|
| **Frontend** | React + TypeScript + Tailwind CSS + shadcn/ui |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL |
| **Authentication** | Clerk |
| **Hosting** | Fly.io / Render / Railway |
| **File Storage** | AWS S3 or Cloudflare R2 |
| **Logging** | Logtail / Betterstack |
| **AI/LLM** | OpenAI (gpt-4-turbo) |
| **Vector DB** | Qdrant or Chroma (local embeddings) |
| **CI/CD** | GitHub Actions |

## Project Vision

Lightsail is a compliance automation platform that helps startups and SMBs achieve and maintain compliance with frameworks like SOC 2, ISO 27001, GDPR, and NDPR. The platform automates evidence collection, policy management, and audit readiness while being significantly more affordable than enterprise solutions like Vanta or Drata.

### Core Value Propositions
1. **Automation-First**: Reduce manual compliance work by 70%+ through integrations
2. **Affordable**: 40-60% cheaper than Vanta/Drata for SMB market
3. **AI-Assisted**: Use LLMs for policy generation, gap analysis, and remediation guidance
4. **Multi-Framework**: Support multiple compliance frameworks with unified control mapping
5. **Regional Focus**: Strong support for emerging markets (Nigeria/NDPR) alongside US/UK

## Target Markets

| Region | Frameworks | Pricing Target |
|--------|------------|----------------|
| United States | SOC 2, ISO 27001 | $299-799/month |
| United Kingdom | ISO 27001, GDPR | £249-649/month |
| Nigeria | NDPR/NDPA, ISO 27001 | ₦150,000-400,000/month |

## Architecture Principles

### Multi-Tenancy
- **Single database, shared schema** with `organization_id` on all tenant-scoped tables
- Row-Level Security (RLS) in PostgreSQL for data isolation
- Never query tenant data without `organization_id` filter

### API Design
- RESTful APIs with consistent resource naming
- All endpoints prefixed with `/api/v1/`
- JWT-based authentication via Clerk
- Organization context derived from authenticated user

### Security First
- All data encrypted at rest and in transit
- Secrets managed via environment variables (never committed)
- OWASP Top 10 compliance required
- Audit logging for all sensitive operations

## Code Conventions

### TypeScript Standards
```typescript
// Use explicit types, avoid `any`
interface Control {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  frameworkMappings: FrameworkMapping[];
  status: ControlStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Use enums for fixed values
enum ControlStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  IMPLEMENTED = 'implemented',
  NEEDS_ATTENTION = 'needs_attention'
}

// Async/await over raw promises
async function getControls(organizationId: string): Promise<Control[]> {
  // implementation
}
```

### File Structure
```
src/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── services/        # Business logic
│   ├── models/          # Database models/types
│   ├── middleware/      # Auth, validation, error handling
│   ├── integrations/    # Third-party API clients
│   ├── routes/          # Express route definitions
│   ├── utils/           # Helper functions
│   └── config/          # Configuration management
├── frontend/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API client functions
│   ├── stores/          # State management
│   ├── types/           # TypeScript interfaces
│   └── utils/           # Helper functions
└── shared/
    └── types/           # Types shared between frontend/backend
```

### Naming Conventions
- **Files**: `kebab-case.ts` (e.g., `control-service.ts`)
- **Components**: `PascalCase.tsx` (e.g., `ControlCard.tsx`)
- **Functions**: `camelCase` (e.g., `getControlById`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`)
- **Database tables**: `snake_case` (e.g., `compliance_controls`)
- **API endpoints**: `kebab-case` (e.g., `/api/v1/compliance-controls`)

## Database Guidelines

### Core Entities
1. **organizations** - Tenant accounts
2. **users** - User accounts (linked to Clerk)
3. **frameworks** - Compliance frameworks (SOC 2, ISO 27001, etc.)
4. **controls** - Individual compliance controls
5. **control_framework_mappings** - Links controls to framework requirements
6. **evidence** - Collected compliance evidence
7. **policies** - Policy documents
8. **integrations** - Connected third-party services
9. **tasks** - Compliance tasks and remediation items
10. **audit_logs** - System audit trail

### Multi-Tenant Pattern
```sql
-- Every tenant-scoped table MUST have organization_id
CREATE TABLE controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  -- ... other fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Always create index on organization_id
CREATE INDEX idx_controls_organization_id ON controls(organization_id);

-- Use RLS for additional security
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
```

### Audit Logging
All create, update, delete operations on sensitive entities must be logged:
```typescript
interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

## API Design

### Standard Response Format
```typescript
// Success response
{
  "success": true,
  "data": { /* response payload */ },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

### Authentication Flow
1. User authenticates via Clerk (frontend)
2. Clerk provides JWT token
3. Backend validates JWT on each request
4. Extract `userId` and `organizationId` from token claims
5. Apply organization context to all queries

## Security Requirements

### Authentication & Authorization
- All API endpoints require authentication (except public endpoints like health checks)
- Organization-level RBAC: Owner, Admin, Member, Viewer
- Feature-level permissions for sensitive operations

### Data Protection
- Encrypt sensitive fields (API keys, tokens) using AES-256
- Use parameterized queries (never string concatenation for SQL)
- Sanitize all user inputs
- Implement rate limiting on all endpoints

### Secrets Management
```typescript
// NEVER do this
const apiKey = "sk-live-abc123"; // Hardcoded secret

// Always use environment variables
const apiKey = process.env.STRIPE_API_KEY;
```

### OWASP Compliance
- SQL Injection: Use ORM/parameterized queries
- XSS: Sanitize outputs, use React's built-in escaping
- CSRF: Implement CSRF tokens for state-changing operations
- Broken Authentication: Use Clerk, implement session management
- Sensitive Data Exposure: Encrypt at rest, TLS in transit

## What NOT To Do

### Anti-Patterns to Avoid
1. **Never query without organization_id filter** - Data leakage risk
2. **Never store secrets in code** - Use environment variables
3. **Never use `any` type** - Always define explicit types
4. **Never skip input validation** - Validate all user inputs
5. **Never log sensitive data** - Mask PII, tokens, passwords
6. **Never use synchronous file operations** - Use async/await
7. **Never catch errors silently** - Log and handle appropriately
8. **Never skip audit logging** - All sensitive operations must be logged

### Code Smells to Fix
```typescript
// BAD: No organization context
const controls = await db.query('SELECT * FROM controls');

// GOOD: Always filter by organization
const controls = await db.query(
  'SELECT * FROM controls WHERE organization_id = $1',
  [organizationId]
);

// BAD: Catching and ignoring errors
try {
  await riskyOperation();
} catch (e) {}

// GOOD: Handle errors properly
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new ApplicationError('Operation failed', error);
}
```

## Feature Scope

### MVP Features (Build First)
- [ ] User authentication and organization management
- [ ] Dashboard with compliance score overview
- [ ] Control library with framework mappings
- [ ] Evidence collection (manual upload)
- [ ] AWS integration (IAM, CloudTrail, Config)
- [ ] GitHub integration (repos, branch protection)
- [ ] Policy templates and editor
- [ ] Basic task management
- [ ] SOC 2 Type I framework support
- [ ] ISO 27001 framework support (Annex A controls, Statement of Applicability)

### Post-MVP Features (Build Second)
- [ ] Additional integrations (GCP, Azure, Jira, Slack)
- [ ] AI-powered policy generation
- [ ] Automated evidence collection
- [ ] GDPR framework support
- [ ] Vendor risk management
- [ ] Advanced reporting and exports

### Advanced Features (Build Later)
- [ ] NDPR/NDPA framework support
- [ ] Custom framework builder
- [ ] Auditor portal
- [ ] API access for customers
- [ ] White-label options
- [ ] SOC 2 Type II continuous monitoring

## Integration Patterns

### Generic Integration Interface
```typescript
interface Integration {
  id: string;
  organizationId: string;
  type: IntegrationType;
  name: string;
  config: EncryptedConfig;
  status: 'active' | 'inactive' | 'error';
  lastSyncAt: Date | null;
}

interface IntegrationProvider {
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;
  collectEvidence(controlIds: string[]): Promise<Evidence[]>;
  getStatus(): Promise<IntegrationStatus>;
}
```

### Evidence Collection Pattern
1. User connects integration
2. System stores encrypted credentials
3. Scheduled job runs evidence collection
4. Evidence linked to relevant controls
5. Compliance score updated automatically

## AI/LLM Usage Guidelines

### Use Cases
1. **Policy Generation**: Generate policy drafts from templates
2. **Gap Analysis**: Identify missing controls or evidence
3. **Remediation Guidance**: Suggest fixes for compliance gaps
4. **Document Summarization**: Extract key info from uploaded docs

### Implementation Guidelines
```typescript
// Always include organization context for personalization
const prompt = buildPrompt({
  task: 'generate_policy',
  template: policyTemplate,
  organizationContext: {
    industry: org.industry,
    size: org.employeeCount,
    existingPolicies: org.policies
  }
});

// Use structured outputs for consistency
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' }
});
```

### Cost Management
- Cache common queries/responses
- Use embeddings for semantic search (cheaper than LLM calls)
- Implement token budgets per organization
- Use smaller models for simple tasks (gpt-3.5-turbo for classification)

## Testing Strategy

### Test Types Required
1. **Unit Tests**: All services and utilities
2. **Integration Tests**: API endpoints, database operations
3. **E2E Tests**: Critical user flows (auth, evidence upload)

### Testing Tools
- **Backend**: Jest, Supertest
- **Frontend**: Vitest, React Testing Library, Playwright
- **Database**: Test containers, fixtures

### Test Requirements
- Minimum 80% code coverage for business logic
- All API endpoints must have integration tests
- Critical flows must have E2E tests

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/lightsail

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_xxx
CLERK_PUBLISHABLE_KEY=pk_live_xxx

# AWS Integration
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1

# OpenAI
OPENAI_API_KEY=sk-xxx

# File Storage
S3_BUCKET=lightsail-evidence
S3_REGION=us-east-1

# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

## Reference Documents

For detailed specifications, see:
- [Product Specification](docs/PRODUCT_SPEC.md) - Features, personas, roadmap
- [Architecture](docs/ARCHITECTURE.md) - System design, deployment
- [Database Schema](docs/DATABASE_SCHEMA.md) - Tables, relationships
- [API Reference](docs/API_REFERENCE.md) - Endpoints, formats
- [Integrations](docs/INTEGRATIONS.md) - Third-party integration patterns
- [Compliance Frameworks](docs/COMPLIANCE_FRAMEWORKS.md) - Framework requirements
- [Business Context](docs/BUSINESS_CONTEXT.md) - Market, competitors, pricing

## Quick Commands

```bash
# Development
npm run dev              # Start backend dev server
npm run dev:frontend     # Start frontend dev server
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with test data

# Testing
npm run test             # Run all tests
npm run test:unit        # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e         # Run E2E tests

# Production
npm run build            # Build for production
npm run start            # Start production server
```
