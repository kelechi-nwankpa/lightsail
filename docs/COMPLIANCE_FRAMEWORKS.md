# Lightsail Compliance Frameworks Documentation

## Overview

This document provides detailed information about the compliance frameworks supported by Lightsail, including control mappings, evidence requirements, and implementation guidance.

## Supported Frameworks

| Framework | Status | Target Market |
|-----------|--------|---------------|
| SOC 2 | MVP | US, Global |
| ISO 27001 | Post-MVP | UK, Global |
| GDPR | Post-MVP | EU, UK |
| NDPR | Advanced | Nigeria |

---

## SOC 2 (Service Organization Control 2)

### Overview

SOC 2 is an auditing procedure developed by the AICPA that ensures service providers securely manage data to protect the interests of the organization and the privacy of its clients. It's based on the Trust Services Criteria (TSC).

### Trust Services Categories

| Category | Code | Description |
|----------|------|-------------|
| **Security** | CC | Common Criteria - Protection against unauthorized access |
| **Availability** | A | System availability for operation and use |
| **Processing Integrity** | PI | System processing is complete, valid, accurate, timely |
| **Confidentiality** | C | Information designated as confidential is protected |
| **Privacy** | P | Personal information is collected, used, retained, disclosed properly |

### Common Criteria (Security) - Required for All SOC 2

#### CC1: Control Environment
The control environment sets the tone of an organization, influencing the control consciousness of its people.

| Criteria | Name | Description | Evidence Types |
|----------|------|-------------|----------------|
| CC1.1 | COSO Principle 1 | Demonstrates commitment to integrity and ethical values | Code of conduct, Ethics policy, Training records |
| CC1.2 | COSO Principle 2 | Board exercises oversight responsibility | Board meeting minutes, Governance charter |
| CC1.3 | COSO Principle 3 | Management establishes structures, reporting lines, authorities | Org chart, Job descriptions, RACI matrix |
| CC1.4 | COSO Principle 4 | Demonstrates commitment to attract, develop, retain competent individuals | HR policies, Training programs, Performance reviews |
| CC1.5 | COSO Principle 5 | Holds individuals accountable for internal control responsibilities | Policy acknowledgments, Performance metrics |

#### CC2: Communication and Information
Relevant, quality information is identified, captured, and communicated.

| Criteria | Name | Description | Evidence Types |
|----------|------|-------------|----------------|
| CC2.1 | Information Quality | Obtains/generates relevant, quality information | Data classification policy, Data flow diagrams |
| CC2.2 | Internal Communication | Internally communicates information | Internal comms, Policy distribution records |
| CC2.3 | External Communication | Communicates with external parties | External comms policy, Customer notifications |

#### CC3: Risk Assessment
The entity identifies, assesses, and manages risks.

| Criteria | Name | Description | Evidence Types |
|----------|------|-------------|----------------|
| CC3.1 | Objective Setting | Specifies suitable objectives | Business objectives documentation |
| CC3.2 | Risk Identification | Identifies and analyzes risks | Risk assessment, Risk register |
| CC3.3 | Fraud Risk | Considers potential for fraud | Fraud risk assessment |
| CC3.4 | Change Management | Identifies and assesses changes | Change management policy, Change logs |

#### CC4: Monitoring Activities
The entity selects, develops, and performs monitoring activities.

| Criteria | Name | Description | Evidence Types |
|----------|------|-------------|----------------|
| CC4.1 | Ongoing Monitoring | Selects and performs ongoing evaluations | Monitoring dashboards, Security reviews |
| CC4.2 | Deficiency Remediation | Evaluates and communicates deficiencies | Remediation tracking, Audit findings |

#### CC5: Control Activities
Actions established through policies and procedures to mitigate risks.

| Criteria | Name | Description | Evidence Types |
|----------|------|-------------|----------------|
| CC5.1 | Control Selection | Selects and develops control activities | Control matrix, Risk-control mapping |
| CC5.2 | Technology Controls | Selects and develops technology controls | IT controls documentation |
| CC5.3 | Policy Deployment | Deploys through policies and procedures | Policy library, Procedure documentation |

#### CC6: Logical and Physical Access Controls
Security controls that limit access to authorized users.

| Criteria | Name | Description | Evidence Types |
|----------|------|-------------|----------------|
| CC6.1 | Access Security | Implements logical access security | Access control policy, MFA status, Password policy |
| CC6.2 | Access Registration | Registers and authorizes new users | User provisioning process, Access request forms |
| CC6.3 | Access Removal | Removes access when no longer needed | Offboarding process, Access removal tickets |
| CC6.4 | Access Review | Reviews access rights periodically | Access review reports, Quarterly reviews |
| CC6.5 | Physical Access | Restricts physical access | Badge access logs, Visitor logs |
| CC6.6 | External Access | Manages access from outside | VPN configuration, Firewall rules |
| CC6.7 | Data Protection | Protects data at rest and in transit | Encryption status, TLS configuration |
| CC6.8 | Malware Protection | Implements malware detection | Antivirus status, EDR deployment |

#### CC7: System Operations
Detects and responds to system anomalies.

| Criteria | Name | Description | Evidence Types |
|----------|------|-------------|----------------|
| CC7.1 | Infrastructure Security | Detects configuration changes | Config management, Security scans |
| CC7.2 | Security Monitoring | Monitors system components | SIEM logs, Alert configurations |
| CC7.3 | Incident Analysis | Evaluates security events | Incident logs, Analysis reports |
| CC7.4 | Incident Response | Responds to security incidents | Incident response plan, Incident tickets |
| CC7.5 | Incident Recovery | Identifies and recovers from incidents | Recovery procedures, Post-mortems |

#### CC8: Change Management
Controls system changes to maintain integrity.

| Criteria | Name | Description | Evidence Types |
|----------|------|-------------|----------------|
| CC8.1 | Change Control | Controls infrastructure and software changes | Change management policy, Change tickets, PR reviews |

#### CC9: Risk Mitigation
Identifies and mitigates business disruption risks.

| Criteria | Name | Description | Evidence Types |
|----------|------|-------------|----------------|
| CC9.1 | Risk Mitigation | Identifies and mitigates risks | Risk treatment plans, Mitigation tracking |
| CC9.2 | Vendor Management | Assesses and manages vendor risks | Vendor assessments, Vendor contracts |

### SOC 2 Type I vs Type II

| Aspect | Type I | Type II |
|--------|--------|---------|
| **Focus** | Design of controls at a point in time | Design AND operating effectiveness over a period |
| **Audit Period** | Single point in time | Typically 6-12 months |
| **Evidence** | Control descriptions, design documentation | Control descriptions + operating evidence |
| **Timeline** | 2-4 months to prepare | 6-12 months of evidence + 2-3 months audit |
| **Recommended For** | First-time SOC 2, urgent deadline | Mature security programs, enterprise customers |

### SOC 2 Control Mapping to Lightsail Features

```typescript
const SOC2_CONTROL_MAPPINGS = {
  'CC6.1': {
    name: 'Access Security',
    lightsailFeatures: ['aws_iam_mfa', 'github_branch_protection', 'gsuite_2sv'],
    automatedEvidence: [
      { source: 'aws', type: 'iam_mfa_status' },
      { source: 'aws', type: 'iam_password_policy' },
      { source: 'gsuite', type: 'mfa_status' }
    ],
    policyTemplates: ['access-control-policy', 'authentication-policy']
  },
  'CC7.2': {
    name: 'Security Monitoring',
    lightsailFeatures: ['aws_cloudtrail', 'github_security_alerts'],
    automatedEvidence: [
      { source: 'aws', type: 'cloudtrail_config' },
      { source: 'aws', type: 'cloudtrail_logs' },
      { source: 'github', type: 'security_alerts' }
    ],
    policyTemplates: ['logging-monitoring-policy']
  },
  'CC8.1': {
    name: 'Change Control',
    lightsailFeatures: ['github_branch_protection', 'github_code_review'],
    automatedEvidence: [
      { source: 'github', type: 'branch_protection' },
      { source: 'github', type: 'ci_status' }
    ],
    policyTemplates: ['change-management-policy', 'sdlc-policy']
  }
};
```

---

## ISO 27001

### Overview

ISO 27001 is an international standard for Information Security Management Systems (ISMS). It provides a systematic approach to managing sensitive company information through risk management processes.

### Key Components

1. **ISMS Scope** - Define boundaries of the security program
2. **Security Policy** - Top-level commitment to information security
3. **Risk Assessment** - Identify and assess information security risks
4. **Risk Treatment** - Select controls to address risks
5. **Statement of Applicability** - Document which controls apply and why
6. **Continuous Improvement** - Plan-Do-Check-Act cycle

### Annex A Control Domains

| Domain | Code | Controls | Description |
|--------|------|----------|-------------|
| Information Security Policies | A.5 | 2 | Management direction for information security |
| Organization of Information Security | A.6 | 7 | Internal organization and mobile/teleworking |
| Human Resource Security | A.7 | 6 | Before, during, and after employment |
| Asset Management | A.8 | 10 | Inventory, classification, media handling |
| Access Control | A.9 | 14 | Business requirements, user access, system access |
| Cryptography | A.10 | 2 | Cryptographic controls and key management |
| Physical and Environmental Security | A.11 | 15 | Secure areas and equipment security |
| Operations Security | A.12 | 14 | Procedures, malware, backup, logging, vulnerabilities |
| Communications Security | A.13 | 7 | Network security and information transfer |
| System Acquisition, Development, Maintenance | A.14 | 13 | Security in development and support |
| Supplier Relationships | A.15 | 5 | Supplier security and service delivery |
| Information Security Incident Management | A.16 | 7 | Incident reporting and response |
| Business Continuity Management | A.17 | 4 | Information security continuity |
| Compliance | A.18 | 8 | Legal, policy, and technical compliance |

### ISO 27001 Annex A Controls (Selected)

#### A.9 Access Control

| Control | Name | Description |
|---------|------|-------------|
| A.9.1.1 | Access Control Policy | Policy on access to information |
| A.9.1.2 | Access to Networks | Access to networks and network services |
| A.9.2.1 | User Registration | User registration and de-registration |
| A.9.2.2 | User Access Provisioning | Formal user access provisioning process |
| A.9.2.3 | Privileged Access | Management of privileged access rights |
| A.9.2.4 | Secret Authentication | Allocation of secret authentication information |
| A.9.2.5 | Access Rights Review | Review of user access rights |
| A.9.2.6 | Access Removal | Removal or adjustment of access rights |
| A.9.3.1 | Secret Information Use | Users required to follow practices for secret info |
| A.9.4.1 | Information Access | Access to information and functions restricted |
| A.9.4.2 | Secure Log-on | Secure log-on procedures |
| A.9.4.3 | Password Management | Password management systems |
| A.9.4.4 | Privileged Utility Programs | Use of privileged utility programs |
| A.9.4.5 | Program Source Code | Access to program source code restricted |

#### A.12 Operations Security

| Control | Name | Description |
|---------|------|-------------|
| A.12.1.1 | Documented Procedures | Documented operating procedures |
| A.12.1.2 | Change Management | Changes to organization, processes, systems |
| A.12.1.3 | Capacity Management | Monitoring and capacity projections |
| A.12.1.4 | Environment Separation | Separation of development, test, production |
| A.12.2.1 | Malware Controls | Detection, prevention, recovery from malware |
| A.12.3.1 | Information Backup | Backup copies of information |
| A.12.4.1 | Event Logging | Event logs recording user activities |
| A.12.4.2 | Log Protection | Protection of log information |
| A.12.4.3 | Admin Logs | Administrator and operator activities logged |
| A.12.4.4 | Clock Synchronization | Clocks synchronized to single time source |
| A.12.5.1 | Software Installation | Installation of software on operational systems |
| A.12.6.1 | Vulnerability Management | Technical vulnerability management |
| A.12.6.2 | Software Installation Restrictions | Rules for software installation by users |
| A.12.7.1 | Audit Controls | Audit requirements for operational systems |

### SOC 2 to ISO 27001 Mapping

| SOC 2 Criteria | ISO 27001 Controls |
|----------------|-------------------|
| CC6.1 (Access Security) | A.9.4.2, A.9.4.3 |
| CC6.2 (User Registration) | A.9.2.1, A.9.2.2 |
| CC6.3 (Access Removal) | A.9.2.6 |
| CC6.4 (Access Review) | A.9.2.5 |
| CC6.7 (Data Protection) | A.10.1.1, A.10.1.2 |
| CC7.2 (Security Monitoring) | A.12.4.1, A.12.4.2, A.12.4.3 |
| CC8.1 (Change Control) | A.12.1.2, A.14.2.2 |

---

## GDPR (General Data Protection Regulation)

### Overview

GDPR is a comprehensive data protection regulation applicable to organizations processing personal data of EU residents. It establishes requirements for lawful processing, data subject rights, and organizational accountability.

### Key Principles (Article 5)

| Principle | Description |
|-----------|-------------|
| **Lawfulness, Fairness, Transparency** | Personal data processed lawfully, fairly, and transparently |
| **Purpose Limitation** | Collected for specified, explicit, and legitimate purposes |
| **Data Minimization** | Adequate, relevant, and limited to what is necessary |
| **Accuracy** | Accurate and kept up to date |
| **Storage Limitation** | Kept no longer than necessary |
| **Integrity and Confidentiality** | Processed with appropriate security |
| **Accountability** | Controller responsible for demonstrating compliance |

### Data Subject Rights

| Right | Article | Description |
|-------|---------|-------------|
| Right to be Informed | 13, 14 | Information about data processing |
| Right of Access | 15 | Access to personal data |
| Right to Rectification | 16 | Correction of inaccurate data |
| Right to Erasure | 17 | Deletion of personal data |
| Right to Restrict Processing | 18 | Limit how data is used |
| Right to Data Portability | 20 | Receive data in portable format |
| Right to Object | 21 | Object to certain processing |
| Rights Related to Automated Decisions | 22 | Human review of automated decisions |

### GDPR Requirements by Article

| Article | Requirement | Lightsail Implementation |
|---------|-------------|-------------------------|
| Art. 5 | Processing principles | Data processing policy |
| Art. 6 | Lawful basis | Consent management, Legal basis documentation |
| Art. 7 | Consent conditions | Consent records |
| Art. 12-14 | Transparency | Privacy notice |
| Art. 15-22 | Data subject rights | DSR workflow |
| Art. 24 | Controller responsibility | Accountability documentation |
| Art. 25 | Privacy by design | Development guidelines |
| Art. 28 | Processor requirements | DPA templates |
| Art. 30 | Records of processing | Data inventory |
| Art. 32 | Security measures | Security controls |
| Art. 33 | Breach notification | Incident response |
| Art. 35 | Impact assessment | DPIA templates |
| Art. 37-39 | DPO | DPO designation (if required) |

### GDPR to SOC 2/ISO Mapping

| GDPR Requirement | SOC 2 | ISO 27001 |
|------------------|-------|-----------|
| Art. 32 Security | CC6, CC7 | A.8, A.9, A.10, A.12 |
| Art. 33 Breach Notification | CC7.4, CC7.5 | A.16 |
| Art. 25 Privacy by Design | CC3, CC5 | A.14 |
| Art. 28 Processors | CC9.2 | A.15 |

---

## NDPR (Nigeria Data Protection Regulation)

### Overview

The Nigeria Data Protection Regulation (NDPR) was issued in 2019 by NITDA (National Information Technology Development Agency). It establishes requirements for processing personal data of Nigerian citizens and residents.

### Key Requirements

| Requirement | Description |
|-------------|-------------|
| **Lawful Processing** | Processing must have legal basis |
| **Consent** | Clear, specific consent required |
| **Data Subject Rights** | Access, rectification, erasure, portability |
| **Data Protection Officer** | Required for certain organizations |
| **Data Protection Audit** | Annual audit requirement |
| **Breach Notification** | Notify within 72 hours |
| **Cross-Border Transfer** | Restrictions on international transfers |

### NDPR Data Protection Audit Requirements

Organizations must submit an annual Data Protection Audit (DPA) to NITDA:

| Category | Requirement |
|----------|-------------|
| **Data Controllers processing 2000+ records** | Full audit by licensed Data Protection Compliance Organization (DPCO) |
| **Data Controllers processing <2000 records** | Self-assessment audit |
| **Deadline** | March 15 of each year |

### NDPR Compliance Checklist

```typescript
const NDPR_REQUIREMENTS = [
  {
    id: 'ndpr_1',
    category: 'Governance',
    requirement: 'Appoint Data Protection Officer',
    description: 'Organizations processing personal data must appoint a DPO',
    evidence: ['DPO appointment letter', 'DPO contact published']
  },
  {
    id: 'ndpr_2',
    category: 'Governance',
    requirement: 'Register with NITDA',
    description: 'Data controllers must register with NITDA',
    evidence: ['NITDA registration certificate']
  },
  {
    id: 'ndpr_3',
    category: 'Governance',
    requirement: 'Annual Data Protection Audit',
    description: 'Submit annual audit report to NITDA',
    evidence: ['Audit report', 'NITDA submission confirmation']
  },
  {
    id: 'ndpr_4',
    category: 'Consent',
    requirement: 'Obtain Valid Consent',
    description: 'Collect freely given, specific, informed consent',
    evidence: ['Consent forms', 'Consent records', 'Privacy notice']
  },
  {
    id: 'ndpr_5',
    category: 'Security',
    requirement: 'Implement Security Measures',
    description: 'Protect personal data with appropriate security',
    evidence: ['Security policy', 'Technical controls', 'Access logs']
  },
  {
    id: 'ndpr_6',
    category: 'Breach',
    requirement: 'Breach Notification',
    description: 'Report breaches to NITDA within 72 hours',
    evidence: ['Incident response plan', 'Breach register']
  },
  {
    id: 'ndpr_7',
    category: 'Rights',
    requirement: 'Honor Data Subject Rights',
    description: 'Respond to data subject requests within 30 days',
    evidence: ['DSR procedures', 'Request log']
  },
  {
    id: 'ndpr_8',
    category: 'Transfer',
    requirement: 'Cross-Border Transfer Safeguards',
    description: 'Ensure adequate protection for international transfers',
    evidence: ['Transfer assessment', 'Contractual safeguards']
  }
];
```

### NDPR Penalties

| Violation | Penalty |
|-----------|---------|
| Processing without consent | 2% of annual gross revenue or ₦10 million |
| Failure to register | ₦2 million |
| Late audit submission | ₦1 million |
| Breach notification failure | 2% of annual gross revenue or ₦10 million |

---

## Cross-Framework Control Library

### Unified Control Structure

Lightsail uses a unified control library that maps to multiple frameworks:

```typescript
interface UnifiedControl {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;

  frameworkMappings: {
    soc2?: SOC2Mapping;
    iso27001?: ISO27001Mapping;
    gdpr?: GDPRMapping;
    ndpr?: NDPRMapping;
  };

  evidenceRequirements: EvidenceRequirement[];
  policyRequirements: string[];
  automationPossible: boolean;
  automationSources: string[];
}

interface FrameworkMapping {
  criteria: string;
  name: string;
  coverage: 'full' | 'partial';
  notes?: string;
}
```

### Example Unified Control

```typescript
const ACCESS_CONTROL_MFA: UnifiedControl = {
  id: 'ctrl_mfa_001',
  code: 'AC-MFA-001',
  name: 'Multi-Factor Authentication',
  description: 'Implement multi-factor authentication for all user accounts accessing production systems',
  category: 'Access Control',
  subcategory: 'Authentication',

  frameworkMappings: {
    soc2: {
      criteria: 'CC6.1',
      name: 'Logical and Physical Access Controls',
      coverage: 'partial'
    },
    iso27001: {
      criteria: 'A.9.4.2',
      name: 'Secure Log-on Procedures',
      coverage: 'full'
    },
    gdpr: {
      criteria: 'Art. 32',
      name: 'Security of Processing',
      coverage: 'partial'
    },
    ndpr: {
      criteria: '2.1(1)(d)',
      name: 'Security Safeguards',
      coverage: 'partial'
    }
  },

  evidenceRequirements: [
    {
      type: 'config',
      description: 'MFA configuration settings',
      frequency: 'quarterly',
      automatable: true
    },
    {
      type: 'report',
      description: 'User MFA enrollment status report',
      frequency: 'monthly',
      automatable: true
    },
    {
      type: 'document',
      description: 'Authentication policy',
      frequency: 'annual',
      automatable: false
    }
  ],

  policyRequirements: [
    'authentication-policy',
    'access-control-policy'
  ],

  automationPossible: true,
  automationSources: ['aws', 'github', 'gsuite', 'azure_ad']
};
```

---

## Compliance Score Calculation

### Scoring Algorithm

```typescript
interface ComplianceScore {
  overall: number;          // 0-100
  controlCoverage: number;  // 0-100
  evidenceCoverage: number; // 0-100
  policyCoverage: number;   // 0-100
}

function calculateComplianceScore(
  organizationId: string,
  frameworkId: string
): ComplianceScore {
  const controls = getFrameworkControls(frameworkId);
  const orgControls = getOrganizationControls(organizationId, frameworkId);

  // Control coverage: % of controls implemented
  const implementedControls = orgControls.filter(
    c => c.status === 'implemented'
  ).length;
  const controlCoverage = (implementedControls / controls.length) * 100;

  // Evidence coverage: % of implemented controls with valid evidence
  const controlsWithEvidence = orgControls.filter(c =>
    c.status === 'implemented' &&
    c.evidence.some(e => e.status === 'approved' && !isExpired(e))
  ).length;
  const evidenceCoverage = implementedControls > 0
    ? (controlsWithEvidence / implementedControls) * 100
    : 0;

  // Policy coverage: % of required policies approved
  const requiredPolicies = getRequiredPolicies(frameworkId);
  const approvedPolicies = getOrganizationPolicies(organizationId)
    .filter(p => p.status === 'approved').length;
  const policyCoverage = (approvedPolicies / requiredPolicies.length) * 100;

  // Overall: weighted average
  const overall = (
    controlCoverage * 0.5 +
    evidenceCoverage * 0.35 +
    policyCoverage * 0.15
  );

  return {
    overall: Math.round(overall),
    controlCoverage: Math.round(controlCoverage),
    evidenceCoverage: Math.round(evidenceCoverage),
    policyCoverage: Math.round(policyCoverage)
  };
}
```

### Score Thresholds

| Score Range | Status | Description |
|-------------|--------|-------------|
| 90-100 | Excellent | Audit-ready |
| 75-89 | Good | Minor gaps to address |
| 50-74 | Fair | Significant work needed |
| 25-49 | Poor | Major gaps exist |
| 0-24 | Critical | Just getting started |

---

## Policy Templates

### Core Policy Templates (MVP)

| Policy | Frameworks | Priority |
|--------|------------|----------|
| Information Security Policy | All | Critical |
| Access Control Policy | All | Critical |
| Acceptable Use Policy | All | Critical |
| Data Classification Policy | All | High |
| Incident Response Policy | All | High |
| Change Management Policy | SOC 2, ISO | High |
| Business Continuity Policy | SOC 2, ISO | Medium |
| Vendor Management Policy | SOC 2, ISO | Medium |
| Privacy Policy | GDPR, NDPR | High |
| Data Retention Policy | All | Medium |

### Policy Template Structure

```typescript
interface PolicyTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  frameworks: string[];
  sections: PolicySection[];
  variables: TemplateVariable[];
  controlMappings: string[];
}

interface PolicySection {
  title: string;
  content: string; // Markdown with {{variable}} placeholders
  required: boolean;
}

interface TemplateVariable {
  name: string;
  description: string;
  type: 'text' | 'select' | 'date' | 'list';
  options?: string[];
  default?: string;
}
```

### Example: Information Security Policy Template

```markdown
# Information Security Policy

## 1. Purpose
This policy establishes the information security program for {{company_name}} and defines the security controls, responsibilities, and requirements to protect company information assets.

## 2. Scope
This policy applies to:
- All employees, contractors, and third parties with access to {{company_name}} systems
- All information systems, applications, and data owned or operated by {{company_name}}
- All locations where {{company_name}} business is conducted

## 3. Information Security Objectives
{{company_name}} is committed to:
- Protecting the confidentiality, integrity, and availability of information
- Complying with applicable laws, regulations, and contractual requirements
- Maintaining customer trust through robust security practices
- Continuously improving our security posture

## 4. Roles and Responsibilities

### 4.1 Executive Leadership
- Approve information security policies
- Allocate resources for security program
- Set security objectives and risk tolerance

### 4.2 {{security_role_title}}
- Develop and maintain security policies
- Monitor security controls effectiveness
- Coordinate security incident response
- Report security status to leadership

### 4.3 All Employees
- Follow security policies and procedures
- Report security incidents and concerns
- Protect credentials and access rights
- Complete required security training

## 5. Security Controls

### 5.1 Access Control
- All access to systems must be authorized and documented
- Multi-factor authentication is required for {{mfa_scope}}
- Access rights are reviewed {{access_review_frequency}}

### 5.2 Data Protection
- Data is classified according to sensitivity
- Encryption is used for data at rest and in transit
- Data retention follows documented schedules

### 5.3 Security Monitoring
- Security events are logged and monitored
- Alerts are investigated and documented
- Regular security assessments are conducted

## 6. Policy Compliance
Violations of this policy may result in disciplinary action, up to and including termination.

## 7. Review and Updates
This policy will be reviewed {{review_frequency}} or upon significant changes.

---
**Effective Date:** {{effective_date}}
**Last Review:** {{last_review_date}}
**Next Review:** {{next_review_date}}
**Approved By:** {{approver_name}}, {{approver_title}}
```
