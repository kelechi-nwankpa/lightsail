// SOC 2 Trust Services Criteria
// Based on AICPA 2017 Trust Services Criteria

export interface RequirementData {
  code: string;
  name: string;
  description: string;
  guidance?: string;
  children?: RequirementData[];
}

export const soc2Requirements: RequirementData[] = [
  // CC1 - Control Environment
  {
    code: 'CC1',
    name: 'Control Environment',
    description: 'The entity demonstrates commitment to integrity and ethical values.',
    children: [
      {
        code: 'CC1.1',
        name: 'COSO Principle 1',
        description: 'The entity demonstrates a commitment to integrity and ethical values.',
        guidance: 'Establish standards of conduct, evaluate adherence, and address deviations in a timely manner.',
      },
      {
        code: 'CC1.2',
        name: 'COSO Principle 2',
        description: 'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control.',
        guidance: 'Establish oversight responsibilities and apply relevant expertise to oversight activities.',
      },
      {
        code: 'CC1.3',
        name: 'COSO Principle 3',
        description: 'Management establishes, with board oversight, structures, reporting lines, and appropriate authorities and responsibilities in the pursuit of objectives.',
        guidance: 'Consider all structures of the entity and establish reporting lines with defined authorities and responsibilities.',
      },
      {
        code: 'CC1.4',
        name: 'COSO Principle 4',
        description: 'The entity demonstrates a commitment to attract, develop, and retain competent individuals in alignment with objectives.',
        guidance: 'Establish policies and practices for recruitment, development, and retention of qualified personnel.',
      },
      {
        code: 'CC1.5',
        name: 'COSO Principle 5',
        description: 'The entity holds individuals accountable for their internal control responsibilities in the pursuit of objectives.',
        guidance: 'Enforce accountability through structures, authorities, and responsibilities.',
      },
    ],
  },
  // CC2 - Communication and Information
  {
    code: 'CC2',
    name: 'Communication and Information',
    description: 'The entity obtains or generates and uses relevant, quality information to support the functioning of internal control.',
    children: [
      {
        code: 'CC2.1',
        name: 'COSO Principle 13',
        description: 'The entity obtains or generates and uses relevant, quality information to support the functioning of internal control.',
        guidance: 'Identify information requirements and obtain information from internal and external sources.',
      },
      {
        code: 'CC2.2',
        name: 'COSO Principle 14',
        description: 'The entity internally communicates information, including objectives and responsibilities for internal control, necessary to support the functioning of internal control.',
        guidance: 'Communicate with the board, provide separate communication lines, and select relevant methods of communication.',
      },
      {
        code: 'CC2.3',
        name: 'COSO Principle 15',
        description: 'The entity communicates with external parties regarding matters affecting the functioning of internal control.',
        guidance: 'Communicate to external parties and enable inbound communications from external parties.',
      },
    ],
  },
  // CC3 - Risk Assessment
  {
    code: 'CC3',
    name: 'Risk Assessment',
    description: 'The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks relating to objectives.',
    children: [
      {
        code: 'CC3.1',
        name: 'COSO Principle 6',
        description: 'The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks relating to objectives.',
        guidance: 'Operations objectives, external financial reporting objectives, external non-financial reporting objectives, internal reporting objectives, and compliance objectives.',
      },
      {
        code: 'CC3.2',
        name: 'COSO Principle 7',
        description: 'The entity identifies risks to the achievement of its objectives across the entity and analyzes risks as a basis for determining how the risks should be managed.',
        guidance: 'Include entity, subsidiary, division, operating unit, and functional levels. Analyze internal and external factors.',
      },
      {
        code: 'CC3.3',
        name: 'COSO Principle 8',
        description: 'The entity considers the potential for fraud in assessing risks to the achievement of objectives.',
        guidance: 'Consider various types of fraud, assess incentive and pressures, opportunity, and attitudes and rationalizations.',
      },
      {
        code: 'CC3.4',
        name: 'COSO Principle 9',
        description: 'The entity identifies and assesses changes that could significantly impact the system of internal control.',
        guidance: 'Assess changes in the external environment, business model, and leadership.',
      },
    ],
  },
  // CC4 - Monitoring Activities
  {
    code: 'CC4',
    name: 'Monitoring Activities',
    description: 'The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning.',
    children: [
      {
        code: 'CC4.1',
        name: 'COSO Principle 16',
        description: 'The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning.',
        guidance: 'Consider mix of ongoing and separate evaluations, consider rate of change, establish baseline understanding, use knowledgeable personnel, integrate with business processes.',
      },
      {
        code: 'CC4.2',
        name: 'COSO Principle 17',
        description: 'The entity evaluates and communicates internal control deficiencies in a timely manner to those parties responsible for taking corrective action, including senior management and the board of directors, as appropriate.',
        guidance: 'Assess results of ongoing and separate evaluations, communicate deficiencies, and monitor corrective actions.',
      },
    ],
  },
  // CC5 - Control Activities
  {
    code: 'CC5',
    name: 'Control Activities',
    description: 'The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels.',
    children: [
      {
        code: 'CC5.1',
        name: 'COSO Principle 10',
        description: 'The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels.',
        guidance: 'Integrate risk assessment with control activities, consider entity-specific factors, determine relevant business processes, evaluate mix of control activity types, consider at what level activities are applied, and address segregation of duties.',
      },
      {
        code: 'CC5.2',
        name: 'COSO Principle 11',
        description: 'The entity also selects and develops general control activities over technology to support the achievement of objectives.',
        guidance: 'Determine dependency between use of technology and general controls, establish relevant technology infrastructure controls, establish relevant security management processes, and establish relevant technology acquisition, development, and maintenance processes.',
      },
      {
        code: 'CC5.3',
        name: 'COSO Principle 12',
        description: 'The entity deploys control activities through policies that establish what is expected and in procedures that put policies into action.',
        guidance: 'Establish policies and procedures to support deployment of management directives, establish responsibility and accountability for executing policies and procedures, perform in a timely manner, take corrective action, perform using competent personnel, and reassess policies and procedures.',
      },
    ],
  },
  // CC6 - Logical and Physical Access Controls
  {
    code: 'CC6',
    name: 'Logical and Physical Access Controls',
    description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets.',
    children: [
      {
        code: 'CC6.1',
        name: 'Logical Access Security',
        description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity\'s objectives.',
        guidance: 'Identify and manage the inventory of information assets, restrict logical access, identify and authenticate users, consider network segmentation, manage points of access, restrict access to information assets, manage identification credentials, and manage authentication credentials.',
      },
      {
        code: 'CC6.2',
        name: 'User Registration and Authorization',
        description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users whose access is administered by the entity.',
        guidance: 'Implement processes to register and authorize new users, require appropriate approvals, and verify identity.',
      },
      {
        code: 'CC6.3',
        name: 'Access Removal',
        description: 'The entity removes access to protected information assets when appropriate.',
        guidance: 'Remove credentials when access is no longer needed, review access on a periodic basis, and implement controls to prevent unauthorized access after termination.',
      },
      {
        code: 'CC6.4',
        name: 'Access Reviews',
        description: 'The entity restricts physical access to facilities and protected information assets to authorized personnel to meet the entity\'s objectives.',
        guidance: 'Create access points and restrict entry, implement physical access controls, and verify authorization before granting access.',
      },
      {
        code: 'CC6.5',
        name: 'Dispose of Assets',
        description: 'The entity discontinues logical and physical protections over physical assets only after the ability to read or recover data and software from those assets has been diminished and is no longer required to meet the entity\'s objectives.',
        guidance: 'Implement processes to remove data from physical assets prior to disposal, destroy physical assets to prevent recovery of data.',
      },
      {
        code: 'CC6.6',
        name: 'External Threats',
        description: 'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software to meet the entity\'s objectives.',
        guidance: 'Restrict installation of software, detect malicious software, and update protection mechanisms.',
      },
      {
        code: 'CC6.7',
        name: 'Transmission Protection',
        description: 'The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes, and protects it during transmission, movement, or removal to meet the entity\'s objectives.',
        guidance: 'Restrict transmission through encryption, protect transmission channels, and implement data loss prevention controls.',
      },
      {
        code: 'CC6.8',
        name: 'Prevent Unauthorized Access',
        description: 'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software to meet the entity\'s objectives.',
        guidance: 'Use intrusion detection systems, implement firewalls, and monitor for unauthorized access attempts.',
      },
    ],
  },
  // CC7 - System Operations
  {
    code: 'CC7',
    name: 'System Operations',
    description: 'The entity detects and monitors system components to support achievement of objectives.',
    children: [
      {
        code: 'CC7.1',
        name: 'Detect and Monitor Security Events',
        description: 'To meet its objectives, the entity uses detection and monitoring procedures to identify (1) changes to configurations that result in the introduction of new vulnerabilities, and (2) susceptibilities to newly discovered vulnerabilities.',
        guidance: 'Implement detection policies, monitor system components, and implement change detection mechanisms.',
      },
      {
        code: 'CC7.2',
        name: 'Monitor System Components',
        description: 'The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors affecting the entity\'s ability to meet its objectives.',
        guidance: 'Implement system monitoring to detect anomalies, define and implement a response process.',
      },
      {
        code: 'CC7.3',
        name: 'Evaluate Security Events',
        description: 'The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives (security incidents) and, if so, takes actions to prevent or address such failures.',
        guidance: 'Respond to security incidents by executing a defined incident response program.',
      },
      {
        code: 'CC7.4',
        name: 'Incident Response',
        description: 'The entity responds to identified security incidents by executing a defined incident response program to understand, contain, remediate, and communicate security incidents, as appropriate.',
        guidance: 'Assign roles and responsibilities, contain security incidents, mitigate ongoing incidents, end threats, restore operations, develop and implement communication protocols, and develop incident escalation procedures.',
      },
      {
        code: 'CC7.5',
        name: 'Recovery from Incidents',
        description: 'The entity identifies, develops, and implements activities to recover from identified security incidents.',
        guidance: 'Restore the affected environment, communicate regarding security incidents to meet recovery objectives.',
      },
    ],
  },
  // CC8 - Change Management
  {
    code: 'CC8',
    name: 'Change Management',
    description: 'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures.',
    children: [
      {
        code: 'CC8.1',
        name: 'Manage Changes',
        description: 'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives.',
        guidance: 'Manage changes throughout the system lifecycle including authorization, design, configuration, testing, approval, and implementation.',
      },
    ],
  },
  // CC9 - Risk Mitigation
  {
    code: 'CC9',
    name: 'Risk Mitigation',
    description: 'The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.',
    children: [
      {
        code: 'CC9.1',
        name: 'Identify and Manage Disruptions',
        description: 'The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.',
        guidance: 'Consider potential disruptions to operations, identify and implement mitigation activities.',
      },
      {
        code: 'CC9.2',
        name: 'Business Continuity',
        description: 'The entity assesses and manages risks associated with vendors and business partners.',
        guidance: 'Establish processes to assess and manage vendor risks, implement vendor management program.',
      },
    ],
  },
  // A1 - Availability
  {
    code: 'A1',
    name: 'Availability',
    description: 'The entity maintains, monitors, and evaluates current processing capacity and use of system components.',
    children: [
      {
        code: 'A1.1',
        name: 'Capacity Management',
        description: 'The entity maintains, monitors, and evaluates current processing capacity and use of system components (infrastructure, data, and software) to manage capacity demand and to enable the implementation of additional capacity to help meet its objectives.',
        guidance: 'Monitor capacity, plan for additional capacity, and implement capacity increases as needed.',
      },
      {
        code: 'A1.2',
        name: 'Environmental Protections',
        description: 'The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections, software, data backup processes, and recovery infrastructure to meet its objectives.',
        guidance: 'Implement backup procedures, maintain recovery infrastructure, and test recovery capabilities.',
      },
      {
        code: 'A1.3',
        name: 'Recovery Testing',
        description: 'The entity tests recovery plan procedures supporting system recovery to meet its objectives.',
        guidance: 'Test recovery procedures periodically and update based on test results.',
      },
    ],
  },
  // C1 - Confidentiality
  {
    code: 'C1',
    name: 'Confidentiality',
    description: 'The entity identifies and maintains confidential information to meet the entity\'s objectives related to confidentiality.',
    children: [
      {
        code: 'C1.1',
        name: 'Identification of Confidential Information',
        description: 'The entity identifies and maintains confidential information to meet the entity\'s objectives related to confidentiality.',
        guidance: 'Identify confidential information, implement identification procedures, and classify information based on confidentiality requirements.',
      },
      {
        code: 'C1.2',
        name: 'Disposal of Confidential Information',
        description: 'The entity disposes of confidential information to meet the entity\'s objectives related to confidentiality.',
        guidance: 'Implement secure disposal procedures for confidential information, including electronic and physical destruction.',
      },
    ],
  },
  // PI1 - Processing Integrity
  {
    code: 'PI1',
    name: 'Processing Integrity',
    description: 'The entity implements policies and procedures over system inputs, including controls over completeness and accuracy.',
    children: [
      {
        code: 'PI1.1',
        name: 'Processing Accuracy and Completeness',
        description: 'The entity implements policies and procedures over system inputs, including controls over completeness and accuracy.',
        guidance: 'Implement input validation controls, verify accuracy of processing, and implement output controls.',
      },
      {
        code: 'PI1.2',
        name: 'System Output',
        description: 'The entity implements policies and procedures over system processing, including review of output for completeness and accuracy.',
        guidance: 'Review and validate system outputs, implement error handling procedures.',
      },
    ],
  },
];
