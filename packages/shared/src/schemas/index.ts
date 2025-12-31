import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

// ============================================
// Organization Schemas
// ============================================

export const organizationPlanSchema = z.enum(['trial', 'starter', 'professional', 'enterprise']);

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(255),
  industry: z.string().max(100).optional(),
  employeeCount: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  country: z.string().length(2).optional(), // ISO country code
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

// ============================================
// Member Schemas
// ============================================

export const memberRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer']);

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: memberRoleSchema.default('member'),
});

export const updateMemberRoleSchema = z.object({
  role: memberRoleSchema,
});

// ============================================
// Control Schemas
// ============================================

export const controlStatusSchema = z.enum(['not_started', 'in_progress', 'implemented', 'not_applicable']);

export const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

export const createControlSchema = z.object({
  code: z.string().max(100).optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  riskLevel: riskLevelSchema.optional(),
  reviewFrequencyDays: z.number().int().positive().default(90),
  frameworkRequirementIds: z.array(z.string().uuid()).optional(),
});

export const updateControlSchema = z.object({
  code: z.string().max(100).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  implementationStatus: controlStatusSchema.optional(),
  implementationNotes: z.string().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  riskLevel: riskLevelSchema.nullable().optional(),
  reviewFrequencyDays: z.number().int().positive().optional(),
});

export const controlFiltersSchema = z.object({
  status: controlStatusSchema.optional(),
  ownerId: z.string().uuid().optional(),
  frameworkId: z.string().uuid().optional(),
  riskLevel: riskLevelSchema.optional(),
  search: z.string().optional(),
}).merge(paginationSchema);

// ============================================
// Evidence Schemas
// ============================================

export const evidenceTypeSchema = z.enum(['document', 'screenshot', 'log', 'config', 'report']);

export const reviewStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const createEvidenceSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: evidenceTypeSchema,
  source: z.string().max(100).default('manual'),
  fileKey: z.string().optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
  fileType: z.string().max(100).optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  controlIds: z.array(z.string().uuid()).optional(),
});

export const updateEvidenceSchema = createEvidenceSchema.partial();

export const reviewEvidenceSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
});

export const evidenceFiltersSchema = z.object({
  controlId: z.string().uuid().optional(),
  type: evidenceTypeSchema.optional(),
  source: z.string().optional(),
  reviewStatus: reviewStatusSchema.optional(),
  validOnly: z.coerce.boolean().optional(),
}).merge(paginationSchema);

// ============================================
// Policy Schemas
// ============================================

export const policyStatusSchema = z.enum(['draft', 'review', 'approved', 'archived']);

export const createPolicySchema = z.object({
  code: z.string().max(100).optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().max(100).optional(),
  content: z.string().min(1),
  ownerId: z.string().uuid().optional(),
  reviewFrequencyDays: z.number().int().positive().default(365),
});

export const updatePolicySchema = z.object({
  code: z.string().max(100).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().max(100).optional(),
  content: z.string().min(1).optional(),
  changeSummary: z.string().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  reviewFrequencyDays: z.number().int().positive().optional(),
});

export const policyFiltersSchema = z.object({
  status: policyStatusSchema.optional(),
  category: z.string().optional(),
  search: z.string().optional(),
}).merge(paginationSchema);

// ============================================
// Task Schemas
// ============================================

export const taskTypeSchema = z.enum(['general', 'remediation', 'review', 'implementation']);

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const taskStatusSchema = z.enum(['open', 'in_progress', 'blocked', 'completed', 'cancelled']);

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: taskTypeSchema.default('general'),
  priority: taskPrioritySchema.default('medium'),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.coerce.date().optional(),
  controlId: z.string().uuid().optional(),
  policyId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  type: taskTypeSchema.optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const taskFiltersSchema = z.object({
  status: taskStatusSchema.optional(),
  assigneeId: z.string().uuid().optional(),
  priority: taskPrioritySchema.optional(),
  type: taskTypeSchema.optional(),
  controlId: z.string().uuid().optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
}).merge(paginationSchema);

// ============================================
// Integration Schemas
// ============================================

export const integrationTypeSchema = z.enum(['aws', 'github', 'gsuite', 'azure_ad', 'jira', 'slack']);

export const connectIntegrationSchema = z.object({
  type: integrationTypeSchema,
  name: z.string().min(1).max(255),
  credentials: z.record(z.unknown()),
  config: z.record(z.unknown()).optional(),
});

export const updateIntegrationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  config: z.record(z.unknown()).optional(),
  syncFrequencyMinutes: z.number().int().positive().optional(),
});

// ============================================
// Type Exports from Schemas
// ============================================

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateControlInput = z.infer<typeof createControlSchema>;
export type UpdateControlInput = z.infer<typeof updateControlSchema>;
export type ControlFilters = z.infer<typeof controlFiltersSchema>;
export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
export type UpdateEvidenceInput = z.infer<typeof updateEvidenceSchema>;
export type ReviewEvidenceInput = z.infer<typeof reviewEvidenceSchema>;
export type EvidenceFilters = z.infer<typeof evidenceFiltersSchema>;
export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
export type PolicyFilters = z.infer<typeof policyFiltersSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
export type ConnectIntegrationInput = z.infer<typeof connectIntegrationSchema>;
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
