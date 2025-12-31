# Lightsail API Reference

## Overview

The Lightsail API is a RESTful API that provides programmatic access to compliance management functionality. All endpoints require authentication and operate within an organization context.

### Base URL
```
Production: https://api.lightsail.app/v1
Development: http://localhost:3000/api/v1
```

### Authentication
All API requests require a valid JWT token from Clerk in the Authorization header:
```
Authorization: Bearer <clerk-jwt-token>
```

### Content Type
```
Content-Type: application/json
Accept: application/json
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response payload */ },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Pagination

List endpoints support pagination with the following query parameters:

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | 1 | - | Page number (1-indexed) |
| `pageSize` | 20 | 100 | Items per page |

Example:
```
GET /api/v1/controls?page=2&pageSize=50
```

## Filtering & Sorting

### Filtering
Most list endpoints support filtering via query parameters:
```
GET /api/v1/controls?status=implemented&ownerId=user_123
```

### Sorting
```
GET /api/v1/controls?sortBy=createdAt&sortOrder=desc
```

---

## Authentication & Users

### Get Current User
```http
GET /api/v1/auth/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "https://...",
    "organizations": [
      {
        "id": "org_123",
        "name": "Acme Corp",
        "role": "admin"
      }
    ]
  }
}
```

---

## Organizations

### List User Organizations
```http
GET /api/v1/organizations
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "org_123",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "plan": "professional",
      "role": "admin",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Organization
```http
GET /api/v1/organizations/:organizationId
```

### Create Organization
```http
POST /api/v1/organizations
```

**Request Body:**
```json
{
  "name": "Acme Corp",
  "industry": "saas",
  "employeeCount": "11-50",
  "country": "US"
}
```

### Update Organization
```http
PATCH /api/v1/organizations/:organizationId
```

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "settings": {
    "timezone": "America/New_York"
  }
}
```

### Organization Members

#### List Members
```http
GET /api/v1/organizations/:organizationId/members
```

#### Invite Member
```http
POST /api/v1/organizations/:organizationId/members/invite
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "member"
}
```

#### Update Member Role
```http
PATCH /api/v1/organizations/:organizationId/members/:memberId
```

**Request Body:**
```json
{
  "role": "admin"
}
```

#### Remove Member
```http
DELETE /api/v1/organizations/:organizationId/members/:memberId
```

---

## Frameworks

### List Frameworks
```http
GET /api/v1/frameworks
```

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `active` | Filter by active status (true/false) |
| `region` | Filter by region (US, UK, NG, EU) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "frm_soc2",
      "code": "SOC2",
      "name": "SOC 2",
      "description": "Service Organization Control 2",
      "category": "security",
      "regions": ["US", "UK", "GLOBAL"],
      "isActive": true
    }
  ]
}
```

### Get Framework
```http
GET /api/v1/frameworks/:frameworkId
```

### Get Framework Requirements
```http
GET /api/v1/frameworks/:frameworkId/requirements
```

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `category` | Filter by category |
| `parentId` | Filter by parent requirement |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "req_cc11",
      "code": "CC1.1",
      "name": "COSO Principle 1",
      "description": "The entity demonstrates a commitment to integrity and ethical values.",
      "category": "Control Environment",
      "guidance": "...",
      "parentId": null
    }
  ]
}
```

### Organization Frameworks

#### List Organization Frameworks
```http
GET /api/v1/organizations/:organizationId/frameworks
```

#### Add Framework to Organization
```http
POST /api/v1/organizations/:organizationId/frameworks
```

**Request Body:**
```json
{
  "frameworkId": "frm_soc2",
  "targetDate": "2024-12-31"
}
```

---

## Controls

### List Controls
```http
GET /api/v1/controls
```

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `status` | Filter by status (not_started, in_progress, implemented, not_applicable) |
| `ownerId` | Filter by owner |
| `frameworkId` | Filter by mapped framework |
| `riskLevel` | Filter by risk level (low, medium, high, critical) |
| `search` | Search by name or description |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ctrl_123",
      "code": "AC-001",
      "name": "Access Control Policy",
      "description": "Implement access control policy and procedures",
      "implementationStatus": "implemented",
      "implementationNotes": "Policy documented and approved",
      "owner": {
        "id": "usr_123",
        "name": "John Doe"
      },
      "riskLevel": "high",
      "isAutomated": false,
      "lastReviewedAt": "2024-01-15T10:00:00Z",
      "nextReviewAt": "2024-04-15T10:00:00Z",
      "frameworkMappings": [
        {
          "frameworkId": "frm_soc2",
          "frameworkName": "SOC 2",
          "requirementCode": "CC6.1",
          "coverage": "full"
        }
      ],
      "evidenceCount": 5,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 85
  }
}
```

### Get Control
```http
GET /api/v1/controls/:controlId
```

### Create Control
```http
POST /api/v1/controls
```

**Request Body:**
```json
{
  "code": "AC-001",
  "name": "Access Control Policy",
  "description": "Implement access control policy and procedures",
  "ownerId": "usr_123",
  "riskLevel": "high",
  "reviewFrequencyDays": 90,
  "frameworkRequirementIds": ["req_cc61", "req_cc62"]
}
```

### Update Control
```http
PATCH /api/v1/controls/:controlId
```

**Request Body:**
```json
{
  "implementationStatus": "implemented",
  "implementationNotes": "Policy documented and approved on 2024-01-15"
}
```

### Delete Control
```http
DELETE /api/v1/controls/:controlId
```

### Control Framework Mappings

#### Add Mapping
```http
POST /api/v1/controls/:controlId/mappings
```

**Request Body:**
```json
{
  "frameworkRequirementId": "req_cc61",
  "coverage": "full",
  "notes": "Fully addresses this requirement"
}
```

#### Remove Mapping
```http
DELETE /api/v1/controls/:controlId/mappings/:mappingId
```

---

## Evidence

### List Evidence
```http
GET /api/v1/evidence
```

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `controlId` | Filter by linked control |
| `type` | Filter by type (document, screenshot, log, config, report) |
| `source` | Filter by source (manual, aws, github, gsuite) |
| `reviewStatus` | Filter by review status (pending, approved, rejected) |
| `validOnly` | Show only non-expired evidence (true/false) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "evd_123",
      "title": "AWS CloudTrail Logs - January 2024",
      "description": "CloudTrail logs showing API activity",
      "type": "log",
      "source": "aws",
      "fileName": "cloudtrail-2024-01.json",
      "fileSize": 1048576,
      "fileType": "application/json",
      "collectedAt": "2024-01-31T10:00:00Z",
      "collectedBy": {
        "id": "usr_123",
        "name": "John Doe"
      },
      "validFrom": "2024-01-01",
      "validUntil": "2024-03-31",
      "reviewStatus": "approved",
      "reviewedBy": {
        "id": "usr_456",
        "name": "Jane Smith"
      },
      "reviewedAt": "2024-02-01T10:00:00Z",
      "linkedControls": [
        {
          "id": "ctrl_123",
          "code": "AC-001",
          "name": "Access Control Policy"
        }
      ],
      "createdAt": "2024-01-31T10:00:00Z"
    }
  ]
}
```

### Get Evidence
```http
GET /api/v1/evidence/:evidenceId
```

### Get Evidence Download URL
```http
GET /api/v1/evidence/:evidenceId/download
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://s3.amazonaws.com/...",
    "expiresAt": "2024-02-01T11:00:00Z"
  }
}
```

### Upload Evidence

#### Step 1: Get Upload URL
```http
POST /api/v1/evidence/upload-url
```

**Request Body:**
```json
{
  "filename": "security-policy.pdf",
  "contentType": "application/pdf",
  "size": 1048576
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "fileKey": "org_123/evidence/evd_456/original.pdf"
  }
}
```

#### Step 2: Upload file to presigned URL (client-side)
```javascript
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': contentType }
});
```

#### Step 3: Create Evidence Record
```http
POST /api/v1/evidence
```

**Request Body:**
```json
{
  "title": "Information Security Policy",
  "description": "Current approved security policy document",
  "type": "document",
  "source": "manual",
  "fileKey": "org_123/evidence/evd_456/original.pdf",
  "fileName": "security-policy.pdf",
  "fileSize": 1048576,
  "fileType": "application/pdf",
  "validFrom": "2024-01-01",
  "validUntil": "2025-01-01",
  "controlIds": ["ctrl_123", "ctrl_456"]
}
```

### Update Evidence
```http
PATCH /api/v1/evidence/:evidenceId
```

### Delete Evidence
```http
DELETE /api/v1/evidence/:evidenceId
```

### Review Evidence
```http
POST /api/v1/evidence/:evidenceId/review
```

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Evidence meets requirements"
}
```

### Link Evidence to Control
```http
POST /api/v1/evidence/:evidenceId/controls
```

**Request Body:**
```json
{
  "controlId": "ctrl_789",
  "relevance": "supporting"
}
```

### Unlink Evidence from Control
```http
DELETE /api/v1/evidence/:evidenceId/controls/:controlId
```

---

## Policies

### List Policies
```http
GET /api/v1/policies
```

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `status` | Filter by status (draft, review, approved, archived) |
| `category` | Filter by category |
| `search` | Search by title |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pol_123",
      "code": "ISP-001",
      "title": "Information Security Policy",
      "description": "Core security policy document",
      "category": "security",
      "status": "approved",
      "owner": {
        "id": "usr_123",
        "name": "John Doe"
      },
      "currentVersion": 3,
      "approvedBy": {
        "id": "usr_456",
        "name": "Jane Smith"
      },
      "approvedAt": "2024-01-15T10:00:00Z",
      "lastReviewedAt": "2024-01-15T10:00:00Z",
      "nextReviewAt": "2025-01-15T10:00:00Z",
      "isAiGenerated": false,
      "linkedControlsCount": 5,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Policy
```http
GET /api/v1/policies/:policyId
```

### Get Policy Content
```http
GET /api/v1/policies/:policyId/content
```

**Response:**
```json
{
  "success": true,
  "data": {
    "version": 3,
    "content": "# Information Security Policy\n\n## Purpose\n...",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Get Policy Versions
```http
GET /api/v1/policies/:policyId/versions
```

### Get Specific Version
```http
GET /api/v1/policies/:policyId/versions/:version
```

### Create Policy
```http
POST /api/v1/policies
```

**Request Body:**
```json
{
  "code": "ISP-001",
  "title": "Information Security Policy",
  "description": "Core security policy document",
  "category": "security",
  "content": "# Information Security Policy\n\n## Purpose\n...",
  "ownerId": "usr_123",
  "reviewFrequencyDays": 365
}
```

### Update Policy
```http
PATCH /api/v1/policies/:policyId
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "# Updated Content\n\n...",
  "changeSummary": "Updated section 3 based on audit feedback"
}
```

### Submit for Approval
```http
POST /api/v1/policies/:policyId/submit-for-approval
```

### Approve Policy
```http
POST /api/v1/policies/:policyId/approve
```

**Request Body:**
```json
{
  "notes": "Approved after legal review"
}
```

### Reject Policy
```http
POST /api/v1/policies/:policyId/reject
```

**Request Body:**
```json
{
  "notes": "Section 4 needs clarification"
}
```

### Archive Policy
```http
POST /api/v1/policies/:policyId/archive
```

### Generate Policy with AI
```http
POST /api/v1/policies/generate
```

**Request Body:**
```json
{
  "templateId": "tpl_security_policy",
  "customizations": {
    "companyName": "Acme Corp",
    "industry": "saas",
    "dataTypes": ["customer_data", "pii"],
    "additionalContext": "We use AWS for hosting"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Information Security Policy",
    "content": "# Information Security Policy for Acme Corp\n\n...",
    "suggestedCategory": "security",
    "suggestedControls": ["ctrl_123", "ctrl_456"]
  }
}
```

---

## Tasks

### List Tasks
```http
GET /api/v1/tasks
```

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `status` | Filter by status (open, in_progress, blocked, completed, cancelled) |
| `assigneeId` | Filter by assignee |
| `priority` | Filter by priority (low, medium, high, critical) |
| `type` | Filter by type (general, remediation, review, implementation) |
| `controlId` | Filter by linked control |
| `dueBefore` | Filter by due date (ISO date) |
| `dueAfter` | Filter by due date (ISO date) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tsk_123",
      "title": "Implement MFA for all users",
      "description": "Enable multi-factor authentication...",
      "type": "implementation",
      "priority": "high",
      "status": "in_progress",
      "assignee": {
        "id": "usr_123",
        "name": "John Doe"
      },
      "createdBy": {
        "id": "usr_456",
        "name": "Jane Smith"
      },
      "dueDate": "2024-02-15",
      "linkedControl": {
        "id": "ctrl_123",
        "code": "AC-002",
        "name": "Multi-Factor Authentication"
      },
      "commentCount": 3,
      "tags": ["security", "authentication"],
      "createdAt": "2024-01-20T10:00:00Z",
      "updatedAt": "2024-01-25T10:00:00Z"
    }
  ]
}
```

### Get Task
```http
GET /api/v1/tasks/:taskId
```

### Create Task
```http
POST /api/v1/tasks
```

**Request Body:**
```json
{
  "title": "Implement MFA for all users",
  "description": "Enable multi-factor authentication for all user accounts",
  "type": "implementation",
  "priority": "high",
  "assigneeId": "usr_123",
  "dueDate": "2024-02-15",
  "controlId": "ctrl_123",
  "tags": ["security", "authentication"]
}
```

### Update Task
```http
PATCH /api/v1/tasks/:taskId
```

**Request Body:**
```json
{
  "status": "completed",
  "completedAt": "2024-02-10T10:00:00Z"
}
```

### Delete Task
```http
DELETE /api/v1/tasks/:taskId
```

### Task Comments

#### List Comments
```http
GET /api/v1/tasks/:taskId/comments
```

#### Add Comment
```http
POST /api/v1/tasks/:taskId/comments
```

**Request Body:**
```json
{
  "content": "MFA has been enabled for admin users. Working on regular users next."
}
```

#### Update Comment
```http
PATCH /api/v1/tasks/:taskId/comments/:commentId
```

#### Delete Comment
```http
DELETE /api/v1/tasks/:taskId/comments/:commentId
```

---

## Integrations

### List Integrations
```http
GET /api/v1/integrations
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "int_123",
      "type": "aws",
      "name": "Production AWS Account",
      "status": "active",
      "lastSyncAt": "2024-01-31T10:00:00Z",
      "nextSyncAt": "2024-01-31T11:00:00Z",
      "config": {
        "accountId": "123456789012",
        "regions": ["us-east-1", "us-west-2"]
      },
      "evidenceCollected": 45,
      "connectedBy": {
        "id": "usr_123",
        "name": "John Doe"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Integration
```http
GET /api/v1/integrations/:integrationId
```

### Get Integration Types
```http
GET /api/v1/integrations/types
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "aws",
      "name": "Amazon Web Services",
      "description": "Connect your AWS account for automated evidence collection",
      "icon": "aws",
      "configSchema": {
        "type": "object",
        "properties": {
          "accessKeyId": { "type": "string" },
          "secretAccessKey": { "type": "string" },
          "regions": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["accessKeyId", "secretAccessKey"]
      },
      "evidenceTypes": ["iam_policies", "cloudtrail_logs", "config_rules", "s3_settings"]
    }
  ]
}
```

### Connect Integration
```http
POST /api/v1/integrations
```

**Request Body (AWS):**
```json
{
  "type": "aws",
  "name": "Production AWS Account",
  "credentials": {
    "accessKeyId": "AKIA...",
    "secretAccessKey": "..."
  },
  "config": {
    "regions": ["us-east-1", "us-west-2"]
  }
}
```

**Request Body (GitHub):**
```json
{
  "type": "github",
  "name": "Organization GitHub",
  "credentials": {
    "accessToken": "ghp_..."
  },
  "config": {
    "organization": "acme-corp",
    "repositories": ["api", "web-app", "infrastructure"]
  }
}
```

### Update Integration
```http
PATCH /api/v1/integrations/:integrationId
```

### Test Integration Connection
```http
POST /api/v1/integrations/:integrationId/test
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "message": "Successfully connected to AWS account 123456789012"
  }
}
```

### Sync Integration
```http
POST /api/v1/integrations/:integrationId/sync
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_123",
    "status": "started"
  }
}
```

### Get Sync Status
```http
GET /api/v1/integrations/:integrationId/sync/:jobId
```

### Disconnect Integration
```http
DELETE /api/v1/integrations/:integrationId
```

### Get Integration Logs
```http
GET /api/v1/integrations/:integrationId/logs
```

---

## Dashboard & Reports

### Get Compliance Dashboard
```http
GET /api/v1/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 72,
    "frameworkScores": [
      {
        "frameworkId": "frm_soc2",
        "frameworkName": "SOC 2",
        "score": 72,
        "controlsTotal": 85,
        "controlsImplemented": 61,
        "controlsInProgress": 12,
        "controlsNotStarted": 12
      }
    ],
    "evidenceSummary": {
      "total": 245,
      "valid": 220,
      "expiringSoon": 15,
      "expired": 10
    },
    "taskSummary": {
      "open": 23,
      "inProgress": 8,
      "overdue": 5,
      "completedThisMonth": 12
    },
    "recentActivity": [
      {
        "type": "evidence_uploaded",
        "description": "AWS CloudTrail logs uploaded",
        "userId": "usr_123",
        "userName": "John Doe",
        "timestamp": "2024-01-31T10:00:00Z"
      }
    ]
  }
}
```

### Get Framework Progress
```http
GET /api/v1/dashboard/frameworks/:frameworkId
```

### Get Compliance Score History
```http
GET /api/v1/dashboard/score-history
```

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `frameworkId` | Framework to get history for |
| `period` | Time period (7d, 30d, 90d, 365d) |

### Generate Gap Analysis Report
```http
POST /api/v1/reports/gap-analysis
```

**Request Body:**
```json
{
  "frameworkId": "frm_soc2",
  "format": "pdf"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "rpt_123",
    "status": "generating"
  }
}
```

### Get Report Status
```http
GET /api/v1/reports/:reportId
```

### Download Report
```http
GET /api/v1/reports/:reportId/download
```

---

## Audit Logs

### List Audit Logs
```http
GET /api/v1/audit-logs
```

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `action` | Filter by action type |
| `entityType` | Filter by entity type |
| `entityId` | Filter by entity ID |
| `userId` | Filter by user |
| `startDate` | Filter by date range start |
| `endDate` | Filter by date range end |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log_123",
      "action": "update",
      "entityType": "control",
      "entityId": "ctrl_123",
      "user": {
        "id": "usr_123",
        "email": "user@example.com"
      },
      "changes": {
        "implementationStatus": {
          "old": "in_progress",
          "new": "implemented"
        }
      },
      "ipAddress": "192.168.1.1",
      "timestamp": "2024-01-31T10:00:00Z"
    }
  ]
}
```

---

## Webhooks (Future)

### List Webhooks
```http
GET /api/v1/webhooks
```

### Create Webhook
```http
POST /api/v1/webhooks
```

**Request Body:**
```json
{
  "url": "https://api.example.com/webhooks/lightsail",
  "events": ["control.updated", "evidence.created", "task.completed"],
  "secret": "whsec_..."
}
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `control.created` | A new control was created |
| `control.updated` | A control was updated |
| `control.deleted` | A control was deleted |
| `evidence.created` | New evidence was uploaded |
| `evidence.reviewed` | Evidence was approved/rejected |
| `policy.approved` | A policy was approved |
| `task.created` | A new task was created |
| `task.completed` | A task was completed |
| `integration.synced` | An integration completed sync |
| `score.changed` | Compliance score changed significantly |

---

## Rate Limiting

API requests are rate limited per organization:

| Plan | Requests/minute | Requests/day |
|------|-----------------|--------------|
| Starter | 60 | 10,000 |
| Professional | 120 | 50,000 |
| Enterprise | 300 | Unlimited |

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 118
X-RateLimit-Reset: 1706698800
```

---

## API Versioning

The API uses URL versioning. The current version is `v1`. When breaking changes are introduced, a new version will be released and the old version will be supported for at least 12 months.

```
/api/v1/controls  # Current version
/api/v2/controls  # Future version
```
