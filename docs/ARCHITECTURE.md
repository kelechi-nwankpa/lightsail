# Lightsail Architecture Documentation

## System Overview

Lightsail is a multi-tenant SaaS application built on a modern cloud-native architecture. The system is designed for scalability, security, and maintainability.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   Web App    │  │  Mobile App  │  │   API Users  │                   │
│  │   (React)    │  │   (Future)   │  │   (Future)   │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
└─────────┼─────────────────┼─────────────────┼───────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           CDN / LOAD BALANCER                            │
│                        (Cloudflare / Platform LB)                        │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Node.js + Express API                        │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │    │
│  │  │Controllers│  │ Services  │  │Middleware │  │  Routes   │    │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Background Job Workers                        │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐                    │    │
│  │  │ Evidence  │  │Integration│  │  Report   │                    │    │
│  │  │ Collector │  │   Sync    │  │ Generator │                    │    │
│  │  └───────────┘  └───────────┘  └───────────┘                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  PostgreSQL  │  │    Redis     │  │   S3 / R2    │                   │
│  │  (Primary)   │  │   (Cache)    │  │  (Storage)   │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Clerk   │ │  OpenAI  │ │   AWS    │ │  GitHub  │ │  GSuite  │      │
│  │  (Auth)  │ │  (AI)    │ │(Evidence)│ │(Evidence)│ │(Evidence)│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 18.x |
| TypeScript | Type Safety | 5.x |
| Tailwind CSS | Styling | 3.x |
| shadcn/ui | Component Library | Latest |
| React Query | Server State | 5.x |
| React Router | Routing | 6.x |
| Zustand | Client State | 4.x |
| Vite | Build Tool | 5.x |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime | 20.x LTS |
| Express | Web Framework | 4.x |
| TypeScript | Type Safety | 5.x |
| Prisma | ORM | 5.x |
| Zod | Validation | 3.x |
| Bull | Job Queue | 4.x |
| Winston | Logging | 3.x |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary Database |
| Redis | Caching, Job Queue |
| S3 / R2 | File Storage |
| Clerk | Authentication |
| OpenAI | AI/LLM Services |

## Multi-Tenancy Architecture

### Data Isolation Strategy

Lightsail uses a **shared database, shared schema** approach with `organization_id` discriminator:

```
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Single Schema                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ organizations │ users │ controls │ evidence │ ...   │  │  │
│  │  │               │       │          │          │       │  │  │
│  │  │ All tables have organization_id for tenant isolation │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  Row Level Security (RLS) enforces isolation               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Approach?

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Separate databases | Complete isolation | Complex ops, expensive | ❌ |
| Separate schemas | Good isolation | Complex migrations | ❌ |
| Shared schema + RLS | Simple ops, cost effective | Must enforce filtering | ✅ |

### Implementation Requirements

1. **Every tenant-scoped table** must have `organization_id` column
2. **Every query** must include `organization_id` filter
3. **Row Level Security** policies on all tenant tables
4. **Application-level middleware** extracts org context from JWT

```typescript
// Middleware to extract and validate organization context
async function organizationContext(req, res, next) {
  const { organizationId } = req.auth; // From Clerk JWT

  if (!organizationId) {
    return res.status(401).json({ error: 'Organization context required' });
  }

  // Verify user belongs to organization
  const membership = await db.organizationMember.findUnique({
    where: { userId_organizationId: { userId: req.auth.userId, organizationId } }
  });

  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this organization' });
  }

  req.organizationId = organizationId;
  req.userRole = membership.role;
  next();
}
```

## Authentication & Authorization

### Authentication Flow (Clerk)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  Clerk   │────▶│ Frontend │────▶│ Backend  │
│          │     │  Widget  │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │  1. Login      │                │                │
     │───────────────▶│                │                │
     │                │                │                │
     │  2. JWT Token  │                │                │
     │◀───────────────│                │                │
     │                │                │                │
     │                │  3. Store JWT  │                │
     │                │───────────────▶│                │
     │                │                │                │
     │                │                │  4. API + JWT  │
     │                │                │───────────────▶│
     │                │                │                │
     │                │                │  5. Validate   │
     │                │                │  & Process     │
     │                │                │◀───────────────│
```

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Owner** | Full access, billing, delete organization |
| **Admin** | Manage users, integrations, all compliance features |
| **Member** | View/edit controls, evidence, policies, tasks |
| **Viewer** | Read-only access to compliance data |

```typescript
// Permission matrix
const PERMISSIONS = {
  owner: ['*'],
  admin: [
    'users:manage',
    'integrations:manage',
    'controls:*',
    'evidence:*',
    'policies:*',
    'tasks:*',
    'reports:*'
  ],
  member: [
    'controls:read', 'controls:update',
    'evidence:*',
    'policies:read', 'policies:update',
    'tasks:*',
    'reports:read'
  ],
  viewer: [
    'controls:read',
    'evidence:read',
    'policies:read',
    'tasks:read',
    'reports:read'
  ]
};
```

## API Architecture

### Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        Routes Layer                          │
│  Define endpoints, apply middleware, call controllers        │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Controller Layer                         │
│  Handle HTTP concerns, validate input, format responses      │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                          │
│  Business logic, orchestrate operations, enforce rules       │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Repository Layer                         │
│  Data access, queries, ORM operations                        │
└─────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```typescript
// 1. Route Definition
router.post('/controls',
  authenticate,           // Verify JWT
  organizationContext,    // Extract org context
  authorize('controls:create'),  // Check permissions
  validate(createControlSchema), // Validate input
  controlController.create       // Handle request
);

// 2. Controller
class ControlController {
  async create(req: Request, res: Response) {
    const control = await controlService.create({
      organizationId: req.organizationId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: control
    });
  }
}

// 3. Service
class ControlService {
  async create(data: CreateControlInput): Promise<Control> {
    // Business logic, validation, orchestration
    const control = await this.controlRepository.create(data);

    // Side effects
    await this.auditLogService.log({
      action: 'create',
      entityType: 'control',
      entityId: control.id,
      ...
    });

    return control;
  }
}

// 4. Repository
class ControlRepository {
  async create(data: CreateControlInput): Promise<Control> {
    return this.prisma.control.create({ data });
  }
}
```

## Background Job Architecture

### Job Queue Design (Bull + Redis)

```
┌─────────────────────────────────────────────────────────────┐
│                     Job Producers                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │   API    │  │Scheduler │  │ Webhooks │                   │
│  │ Handlers │  │  (Cron)  │  │          │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
└───────┼─────────────┼─────────────┼─────────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Redis Job Queues                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │   evidence   │ │ integration  │ │    report    │         │
│  │    queue     │ │    queue     │ │    queue     │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Job Workers                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │   Evidence   │ │ Integration  │ │    Report    │         │
│  │   Worker     │ │    Worker    │ │    Worker    │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Job Types

| Queue | Job Types | Schedule |
|-------|-----------|----------|
| `evidence` | Evidence collection, validation | On-demand, daily |
| `integration` | Sync integrations, refresh tokens | Hourly, on-connect |
| `report` | Generate reports, compliance scores | On-demand, weekly |
| `notification` | Email alerts, in-app notifications | Immediate |

### Job Implementation Pattern

```typescript
// Job Producer
await evidenceQueue.add('collect-aws-evidence', {
  organizationId: 'org_123',
  integrationId: 'int_456',
  controlIds: ['ctrl_1', 'ctrl_2']
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: true
});

// Job Consumer
evidenceQueue.process('collect-aws-evidence', async (job) => {
  const { organizationId, integrationId, controlIds } = job.data;

  const integration = await integrationService.get(integrationId);
  const evidence = await awsProvider.collectEvidence(integration, controlIds);

  await evidenceService.saveMany(organizationId, evidence);
  await complianceScoreService.recalculate(organizationId);

  return { collected: evidence.length };
});
```

## File Storage Architecture

### Storage Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      S3 / R2 Bucket                          │
│                                                              │
│  /{organization_id}/                                         │
│  ├── evidence/                                               │
│  │   ├── {evidence_id}/                                      │
│  │   │   ├── original.{ext}                                  │
│  │   │   └── metadata.json                                   │
│  │   └── ...                                                 │
│  ├── policies/                                               │
│  │   ├── {policy_id}/                                        │
│  │   │   ├── v1.pdf                                          │
│  │   │   ├── v2.pdf                                          │
│  │   │   └── metadata.json                                   │
│  │   └── ...                                                 │
│  └── exports/                                                │
│      └── {export_id}.zip                                     │
└─────────────────────────────────────────────────────────────┘
```

### Upload Flow

```typescript
// 1. Request presigned URL
const { uploadUrl, fileKey } = await fileService.getUploadUrl({
  organizationId,
  type: 'evidence',
  filename: 'aws-cloudtrail-logs.json',
  contentType: 'application/json'
});

// 2. Client uploads directly to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': contentType }
});

// 3. Confirm upload and create record
const evidence = await evidenceService.create({
  organizationId,
  fileKey,
  filename: 'aws-cloudtrail-logs.json',
  controlIds: ['ctrl_123']
});
```

## Caching Strategy

### Cache Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Application                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              In-Memory Cache (LRU)                   │    │
│  │         - Framework definitions                      │    │
│  │         - Control templates                          │    │
│  │         - Static configuration                       │    │
│  │         TTL: Application lifetime                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Redis Cache                         │    │
│  │         - User sessions                              │    │
│  │         - Compliance scores                          │    │
│  │         - Integration status                         │    │
│  │         - Rate limiting                              │    │
│  │         TTL: 5 min - 1 hour                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  PostgreSQL                          │    │
│  │         - All persistent data                        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Cache Invalidation Patterns

```typescript
// Cache-aside pattern
async function getComplianceScore(organizationId: string): Promise<Score> {
  const cacheKey = `compliance-score:${organizationId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Calculate fresh score
  const score = await calculateComplianceScore(organizationId);

  // Cache with TTL
  await redis.setex(cacheKey, 300, JSON.stringify(score));

  return score;
}

// Invalidate on changes
async function updateControl(id: string, data: UpdateControlInput) {
  const control = await controlRepository.update(id, data);

  // Invalidate dependent caches
  await redis.del(`compliance-score:${control.organizationId}`);
  await redis.del(`control:${id}`);

  return control;
}
```

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                                    │
│ - TLS 1.3 everywhere                                         │
│ - DDoS protection (Cloudflare)                               │
│ - IP allowlisting for admin                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Application Security                                │
│ - OWASP Top 10 protections                                   │
│ - Rate limiting                                              │
│ - Input validation (Zod)                                     │
│ - Output encoding                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Authentication & Authorization                      │
│ - Clerk JWT validation                                       │
│ - Role-based access control                                  │
│ - Organization context enforcement                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Data Security                                       │
│ - Encryption at rest (AES-256)                               │
│ - Row Level Security                                         │
│ - Secrets management                                         │
│ - Audit logging                                              │
└─────────────────────────────────────────────────────────────┘
```

### Sensitive Data Handling

```typescript
// Encrypt sensitive fields before storage
class IntegrationService {
  private encryptionKey = process.env.ENCRYPTION_KEY;

  async create(data: CreateIntegrationInput) {
    const encryptedCredentials = await encrypt(
      JSON.stringify(data.credentials),
      this.encryptionKey
    );

    return this.repository.create({
      ...data,
      credentials: encryptedCredentials
    });
  }

  async getCredentials(integrationId: string): Promise<Credentials> {
    const integration = await this.repository.get(integrationId);

    return JSON.parse(
      await decrypt(integration.credentials, this.encryptionKey)
    );
  }
}
```

## Deployment Architecture

### Platform Options

| Platform | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Fly.io** | Global edge, simple deploys | Smaller ecosystem | Primary choice |
| **Render** | Easy setup, good DX | Limited regions | Alternative |
| **Railway** | Developer friendly | Newer platform | Alternative |

### Deployment Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Cloudflare                         │    │
│  │  - CDN for static assets                             │    │
│  │  - DDoS protection                                   │    │
│  │  - SSL termination                                   │    │
│  └───────────────────────┬─────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Fly.io / Render / Railway               │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐        │    │
│  │  │  API (1)  │  │  API (2)  │  │ Worker(1) │        │    │
│  │  │  Primary  │  │  Replica  │  │   Jobs    │        │    │
│  │  └───────────┘  └───────────┘  └───────────┘        │    │
│  └───────────────────────┬─────────────────────────────┘    │
│                          │                                   │
│  ┌───────────────────────┼─────────────────────────────┐    │
│  │          Managed Services                            │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐        │    │
│  │  │PostgreSQL │  │   Redis   │  │  S3 / R2  │        │    │
│  │  │ (Primary) │  │  (Cache)  │  │ (Storage) │        │    │
│  │  └───────────┘  └───────────┘  └───────────┘        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

## Monitoring & Observability

### Logging Strategy

```typescript
// Structured logging with Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new BetterStackTransport({ sourceToken: process.env.LOGTAIL_TOKEN })
  ]
});

// Usage with context
logger.info('Evidence collected', {
  organizationId,
  integrationId,
  evidenceCount: evidence.length,
  duration: Date.now() - startTime
});
```

### Key Metrics to Track

| Category | Metrics |
|----------|---------|
| **API** | Request rate, latency (p50, p95, p99), error rate |
| **Database** | Query time, connection pool, slow queries |
| **Jobs** | Queue depth, processing time, failure rate |
| **Business** | Active users, compliance scores, evidence collected |

### Health Checks

```typescript
// /api/v1/health
app.get('/health', async (req, res) => {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkS3()
  ]);

  const healthy = checks.every(c => c.status === 'ok');

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks: {
      database: checks[0],
      redis: checks[1],
      storage: checks[2]
    },
    timestamp: new Date().toISOString()
  });
});
```

## Scalability Considerations

### Horizontal Scaling Points

1. **API Servers**: Stateless, scale horizontally behind load balancer
2. **Workers**: Scale based on queue depth
3. **Database**: Read replicas for heavy read workloads
4. **Cache**: Redis cluster for high availability

### Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| API Response (p95) | < 200ms | < 500ms |
| Page Load | < 2s | < 4s |
| Evidence Collection | < 30s | < 2min |
| Report Generation | < 1min | < 5min |

### Future Scaling Strategies

1. **Database Sharding**: If single-tenant data exceeds reasonable size
2. **CDN for API**: Edge caching for read-heavy endpoints
3. **Event Sourcing**: For compliance audit requirements
4. **Microservices**: If specific domains need independent scaling
