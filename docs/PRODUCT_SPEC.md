# Lightsail Product Specification

## Product Vision

Lightsail is a compliance automation platform designed to help startups and SMBs achieve and maintain compliance with security and privacy frameworks. The platform makes compliance accessible, affordable, and automated—eliminating the manual overhead that traditionally requires expensive consultants and months of work.

### Core Mission
Make compliance accessible to every growing business, not just well-funded enterprises.

### Key Differentiators
1. **Affordable**: 40-60% cheaper than enterprise competitors (Vanta, Drata)
2. **Regional Focus**: First-class support for emerging markets (Nigeria/NDPR)
3. **AI-Native**: Built-in AI for policy generation and gap analysis
4. **Developer-Friendly**: Strong integrations with development tools (GitHub, AWS)
5. **Bootstrapped-Friendly**: No investor-driven feature bloat

## Target Markets

### Primary Markets

| Market | Region | Frameworks | Pricing Target |
|--------|--------|------------|----------------|
| **US Startups** | United States | SOC 2, ISO 27001 | $299-799/month |
| **UK Tech Companies** | United Kingdom | ISO 27001, GDPR | £249-649/month |
| **Nigerian Fintechs** | Nigeria | NDPR, ISO 27001 | ₦150,000-400,000/month |

### Ideal Customer Profile (ICP)

**Primary Target**: Technology companies with 10-200 employees

| Attribute | Description |
|-----------|-------------|
| **Company Size** | 10-200 employees |
| **Stage** | Seed to Series B, or profitable bootstrapped |
| **Industry** | SaaS, Fintech, Healthtech, B2B Tech |
| **Annual Revenue** | $500K - $50M |
| **Compliance Driver** | Enterprise sales, fundraising, regulatory requirement |
| **Technical Maturity** | Uses cloud infrastructure (AWS, GCP, Azure) |

### User Personas

#### 1. The CTO/Technical Co-Founder
- **Goal**: Get SOC 2 done quickly without derailing product roadmap
- **Pain**: Compliance seems like a black box, doesn't know where to start
- **Needs**: Clear guidance, automated evidence collection, technical integrations

#### 2. The Compliance Manager
- **Goal**: Manage ongoing compliance across multiple frameworks
- **Pain**: Manual evidence collection, keeping up with framework changes
- **Needs**: Centralized dashboard, automated reminders, audit-ready reports

#### 3. The Engineering Lead
- **Goal**: Implement security controls without excessive overhead
- **Pain**: Unclear requirements, documentation burden
- **Needs**: Clear control requirements, automated checks, developer-friendly tools

#### 4. The CEO/Founder (at smaller companies)
- **Goal**: Close enterprise deals that require SOC 2
- **Pain**: Compliance is expensive and time-consuming
- **Needs**: Affordable solution, fast time-to-compliance, trust center

## Feature Roadmap

### MVP Features (4-6 months)

These features are required for initial launch:

#### 1. User & Organization Management
- [x] User authentication via Clerk
- [ ] Organization creation and settings
- [ ] Team member invitation and roles (Owner, Admin, Member, Viewer)
- [ ] Organization switching for users with multiple orgs

#### 2. Compliance Dashboard
- [ ] Overall compliance score visualization
- [ ] Framework-specific compliance progress
- [ ] Key metrics: controls implemented, evidence collected, tasks pending
- [ ] Recent activity feed
- [ ] Alerts for expiring evidence or overdue tasks

#### 3. Control Library
- [ ] Pre-built control library mapped to SOC 2
- [ ] Control implementation status tracking
- [ ] Control ownership assignment
- [ ] Framework requirement mapping view
- [ ] Risk level categorization
- [ ] Control search and filtering

#### 4. Evidence Management
- [ ] Manual evidence upload (documents, screenshots)
- [ ] Evidence linking to controls
- [ ] Evidence validity tracking (expiration dates)
- [ ] Evidence review workflow (approve/reject)
- [ ] Evidence history and versioning

#### 5. AWS Integration
- [ ] IAM configuration assessment
- [ ] CloudTrail log analysis
- [ ] AWS Config rule evaluation
- [ ] S3 bucket security checks
- [ ] Evidence auto-collection from AWS

#### 6. GitHub Integration
- [ ] Repository security assessment
- [ ] Branch protection verification
- [ ] CI/CD pipeline checks
- [ ] Code review requirement validation
- [ ] Dependabot/security alerts monitoring

#### 7. Policy Management
- [ ] Policy templates library (10-15 core policies)
- [ ] Policy editor (Markdown-based)
- [ ] Policy versioning
- [ ] Policy approval workflow
- [ ] Policy-to-control linking

#### 8. Basic Task Management
- [ ] Task creation and assignment
- [ ] Due date tracking
- [ ] Task status workflow
- [ ] Task comments
- [ ] Task-to-control linking

#### 9. SOC 2 Framework Support
- [ ] Full SOC 2 Trust Services Criteria mapped
- [ ] SOC 2 Type I readiness assessment
- [ ] Control-to-criteria mapping
- [ ] Gap analysis report

#### 10. ISO 27001 Framework Support
- [ ] ISO 27001 Annex A controls mapped
- [ ] Statement of Applicability generator
- [ ] Risk assessment module
- [ ] ISMS documentation templates
- [ ] Control-to-Annex mapping

### Post-MVP Features (3-6 months after launch)

#### 11. AI-Powered Features
- [ ] AI policy generation from templates
- [ ] AI gap analysis and recommendations
- [ ] AI-assisted remediation guidance
- [ ] Natural language control search

#### 12. Additional Integrations
- [ ] Google Workspace (GSuite) integration
- [ ] Azure AD integration
- [ ] Jira integration
- [ ] Slack notifications
- [ ] GCP integration

#### 13. Advanced Reporting
- [ ] Custom report builder
- [ ] PDF export for auditors
- [ ] Compliance timeline view
- [ ] Board-ready compliance summary
- [ ] Evidence packages for audits

#### 14. GDPR Framework
- [ ] GDPR Article mapping
- [ ] Data processing inventory
- [ ] Privacy impact assessment templates
- [ ] Data subject request tracking

#### 15. Vendor Risk Management
- [ ] Vendor inventory
- [ ] Vendor questionnaires
- [ ] Risk scoring
- [ ] Contract tracking

#### 16. Trust Center
- [ ] Public-facing security page
- [ ] Self-service NDA signing
- [ ] Document sharing portal
- [ ] FAQ management

### Advanced Features (6-12 months after launch)

#### 17. NDPR Framework
- [ ] NDPR regulation mapping
- [ ] Nigeria-specific policy templates
- [ ] NITDA compliance requirements
- [ ] Local data residency guidance

#### 18. Custom Framework Builder
- [ ] Create custom frameworks
- [ ] Import framework requirements
- [ ] Map controls to custom frameworks
- [ ] Custom reporting

#### 19. Auditor Portal
- [ ] Read-only auditor access
- [ ] Evidence request workflow
- [ ] Audit finding tracking
- [ ] Communication log

#### 20. SOC 2 Type II Continuous Monitoring
- [ ] Continuous control monitoring
- [ ] Automated evidence refresh
- [ ] Control effectiveness testing
- [ ] Anomaly detection and alerting

#### 21. API Access
- [ ] Public REST API
- [ ] API key management
- [ ] Webhook notifications
- [ ] Rate limiting

#### 22. Enterprise Features
- [ ] SSO/SAML integration
- [ ] Custom branding
- [ ] Multiple workspace support
- [ ] Dedicated support

## Feature Priority Matrix

| Feature | Business Value | Technical Complexity | Priority |
|---------|---------------|---------------------|----------|
| Auth & Organization | High | Low | P0 - MVP |
| Compliance Dashboard | High | Medium | P0 - MVP |
| Control Library | High | Medium | P0 - MVP |
| Evidence Management | High | Medium | P0 - MVP |
| AWS Integration | High | High | P0 - MVP |
| GitHub Integration | High | Medium | P0 - MVP |
| Policy Management | Medium | Medium | P0 - MVP |
| Task Management | Medium | Low | P0 - MVP |
| SOC 2 Framework | High | Medium | P0 - MVP |
| ISO 27001 Framework | High | Medium | P0 - MVP |
| AI Policy Generation | High | Medium | P1 - Post-MVP |
| Additional Integrations | Medium | Medium | P1 - Post-MVP |
| Trust Center | Medium | Low | P1 - Post-MVP |
| GDPR Framework | Medium | Medium | P1 - Post-MVP |
| NDPR Framework | Medium | Medium | P2 - Advanced |
| Auditor Portal | Medium | Medium | P2 - Advanced |
| Custom Framework | Low | High | P2 - Advanced |
| API Access | Medium | Medium | P2 - Advanced |

## User Flows

### Flow 1: New User Onboarding

```
1. User signs up via Clerk
   └── Email verification

2. Organization Setup
   ├── Organization name
   ├── Industry selection
   ├── Company size
   └── Primary compliance goal (SOC 2, ISO 27001, etc.)

3. Framework Selection
   ├── Select target framework(s)
   └── Set target completion date

4. Integration Connection
   ├── Connect AWS (recommended)
   ├── Connect GitHub (recommended)
   └── Skip for now

5. Initial Assessment
   ├── System scans connected integrations
   ├── Generates initial control recommendations
   └── Creates starter task list

6. Dashboard
   └── User lands on compliance dashboard with action items
```

### Flow 2: Evidence Collection

```
1. User views control requiring evidence
   └── Control detail page shows evidence requirements

2. Evidence Options
   ├── Manual Upload
   │   ├── Upload file
   │   ├── Add title and description
   │   ├── Set validity period
   │   └── Link to control(s)
   │
   └── Automated Collection
       ├── Select integration source
       ├── Choose data type to collect
       └── System collects and links evidence

3. Evidence Review
   ├── Admin reviews evidence
   ├── Approve or reject with comments
   └── Requestor notified of decision

4. Compliance Score Update
   └── Dashboard reflects new evidence
```

### Flow 3: Policy Creation with AI

```
1. User navigates to Policies
   └── Clicks "Create New Policy"

2. Template Selection
   ├── Browse policy templates
   ├── Select template (e.g., "Information Security Policy")
   └── View template preview

3. AI Customization
   ├── System prompts for organization details
   │   ├── Company name
   │   ├── Industry specifics
   │   └── Existing practices
   │
   └── AI generates customized policy draft

4. Review and Edit
   ├── User reviews generated policy
   ├── Makes manual edits
   └── Saves draft

5. Approval Workflow
   ├── Submit for approval
   ├── Approver reviews and approves
   └── Policy becomes active

6. Control Linking
   └── System suggests controls to link based on policy content
```

### Flow 4: Preparing for Audit

```
1. Pre-Audit Assessment
   ├── System generates readiness report
   ├── Identifies gaps in evidence
   └── Lists incomplete controls

2. Gap Remediation
   ├── Review gap list
   ├── Assign tasks to team members
   └── Track completion

3. Evidence Package
   ├── Generate evidence package by framework
   ├── Review all evidence for completeness
   └── Export for auditor

4. Auditor Access (if enabled)
   ├── Create auditor user
   ├── Grant read-only access
   └── Share relevant sections
```

## Success Metrics

### Product Metrics

| Metric | Target (Year 1) |
|--------|-----------------|
| Monthly Active Users (MAU) | 500 |
| Organizations Created | 100 |
| Paying Customers | 50 |
| Average Compliance Score | 75% |
| Evidence Auto-collected | 60% |
| Time to SOC 2 Readiness | < 3 months |

### User Engagement Metrics

| Metric | Target |
|--------|--------|
| Weekly Active Users / MAU | > 60% |
| Controls Updated / Week | > 10 |
| Evidence Uploaded / Week | > 5 |
| Tasks Completed / Week | > 8 |
| Session Duration | > 10 minutes |

### Business Metrics

| Metric | Target (Year 1) |
|--------|-----------------|
| Monthly Recurring Revenue (MRR) | $25,000 |
| Customer Acquisition Cost (CAC) | < $500 |
| Customer Lifetime Value (LTV) | > $5,000 |
| LTV:CAC Ratio | > 10:1 |
| Monthly Churn Rate | < 3% |
| Net Promoter Score (NPS) | > 40 |

## Pricing Strategy

### Tier Structure

| Tier | Target | Price (US) | Features |
|------|--------|------------|----------|
| **Starter** | Small startups (< 25 employees) | $299/month | 1 framework, 3 integrations, 5 users, email support |
| **Professional** | Growing companies (25-100 employees) | $599/month | 2 frameworks, 10 integrations, 15 users, AI features, priority support |
| **Enterprise** | Larger organizations (100+ employees) | $999+/month | Unlimited frameworks, unlimited integrations, unlimited users, SSO, dedicated CSM |

### Regional Pricing

| Region | Starter | Professional | Enterprise |
|--------|---------|--------------|------------|
| United States | $299/mo | $599/mo | $999+/mo |
| United Kingdom | £249/mo | £499/mo | £849+/mo |
| Nigeria | ₦150,000/mo | ₦300,000/mo | ₦500,000+/mo |

### Free Trial
- 14-day free trial of Professional tier
- No credit card required
- Full feature access
- Onboarding call included

## Technical Requirements

### Performance Requirements

| Requirement | Target |
|-------------|--------|
| Page Load Time | < 2 seconds |
| API Response Time (p95) | < 200ms |
| Evidence Upload (10MB file) | < 10 seconds |
| Report Generation | < 1 minute |
| Integration Sync | < 2 minutes |
| Uptime SLA | 99.9% |

### Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Clerk (SOC 2 Type II compliant) |
| Data Encryption at Rest | AES-256 |
| Data Encryption in Transit | TLS 1.3 |
| Secrets Management | Environment variables, encrypted storage |
| Access Logging | Complete audit trail |
| Penetration Testing | Annual third-party assessment |
| Vulnerability Scanning | Automated weekly scans |

### Compliance Requirements

Lightsail must practice what it preaches:

| Framework | Status |
|-----------|--------|
| SOC 2 Type I | Required before launch |
| SOC 2 Type II | Within 12 months |
| GDPR | Required for UK/EU customers |
| NDPR | Required for Nigeria customers |

## Competitive Positioning

### vs. Vanta ($30,000+/year)
- **Our Advantage**: 70% cheaper, faster setup, regional focus
- **Their Advantage**: Market leader, more integrations, enterprise features

### vs. Drata ($25,000+/year)
- **Our Advantage**: 60% cheaper, AI-native, emerging market support
- **Their Advantage**: Continuous monitoring, larger team

### vs. Secureframe ($20,000+/year)
- **Our Advantage**: 50% cheaper, NDPR support, developer focus
- **Their Advantage**: Established brand, more frameworks

### vs. Sprinto ($10,000+/year)
- **Our Advantage**: Similar price, better AI features, multi-region
- **Their Advantage**: India market presence, more integrations

### vs. Manual (Spreadsheets + Consultants)
- **Our Advantage**: 80% time savings, 50% cost savings, automation
- **Their Advantage**: Fully customizable, human judgment

## Launch Requirements

### Must Have for Launch
- [ ] Working authentication and organization management
- [ ] Functional compliance dashboard with real scores
- [ ] Complete SOC 2 control library
- [ ] Manual evidence upload and management
- [ ] At least one working integration (AWS or GitHub)
- [ ] Basic policy templates (5-10 templates)
- [ ] Simple task management
- [ ] Secure data handling (encryption, audit logging)

### Nice to Have for Launch
- [ ] Both AWS and GitHub integrations
- [ ] AI policy generation
- [ ] Trust center
- [ ] Advanced reporting

### Required Before Charging
- [ ] Stripe integration for payments
- [ ] Subscription management
- [ ] Usage metering
- [ ] Invoice generation
