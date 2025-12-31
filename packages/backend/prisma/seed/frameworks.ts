// Framework definitions for seeding

export interface FrameworkDefinition {
  code: string;
  name: string;
  version: string;
  description: string;
}

export const frameworks: FrameworkDefinition[] = [
  {
    code: 'SOC2',
    name: 'SOC 2',
    version: '2017',
    description:
      'Service Organization Control 2 (SOC 2) is a compliance framework developed by the AICPA for service organizations. It focuses on five Trust Services Criteria: Security, Availability, Processing Integrity, Confidentiality, and Privacy.',
  },
  {
    code: 'ISO27001',
    name: 'ISO 27001',
    version: '2022',
    description:
      'ISO/IEC 27001 is an international standard for information security management systems (ISMS). It provides requirements for establishing, implementing, maintaining, and continually improving an ISMS within the context of the organization.',
  },
];
