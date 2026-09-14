import { z } from 'zod';

export const ActionContextSchema = z.object({
  userId: z.string(),
  userRole: z.enum(['admin', 'manager', 'operator', 'system']),
  ipAddress: z.string(),
  deviceId: z.string().optional(),
  timeOfRequest: z.string().datetime(),
  location: z.string().optional()
});

const FinanceRefundSchema = z.object({
  domain: z.literal('finance'),
  actionType: z.literal('refund'),
  payload: z.object({
    amount: z.number().positive(),
    reason: z.string().optional(),
    receiptId: z.string().optional(),
  }),
  context: ActionContextSchema
});

const FinanceTransferSchema = z.object({
  domain: z.literal('finance'),
  actionType: z.literal('transfer'),
  payload: z.object({
    amount: z.number().positive(),
    destination: z.string(),
    accountId: z.string(),
  }),
  context: ActionContextSchema
});

const DevOpsDeploySchema = z.object({
  domain: z.literal('devops'),
  actionType: z.literal('deploy'),
  payload: z.object({
    environment: z.enum(['production', 'staging', 'development']),
    prNumber: z.string().optional(),
    reviewerId: z.string().optional(),
  }),
  context: ActionContextSchema
});

const DevOpsDropSchema = z.object({
  domain: z.literal('devops'),
  actionType: z.literal('drop_database'),
  payload: z.object({
    dbName: z.string(),
  }),
  context: ActionContextSchema
});

const OperationsPermissionsSchema = z.object({
  domain: z.literal('operations'),
  actionType: z.literal('modify_permissions'),
  payload: z.object({
    targetUser: z.string(),
    newRole: z.string(),
  }),
  context: ActionContextSchema
});

const OperationsDeleteAccountSchema = z.object({
  domain: z.literal('operations'),
  actionType: z.literal('delete_account'),
  payload: z.object({
    targetUser: z.string(),
  }),
  context: ActionContextSchema
});

// Fallback schema to allow unknown actions to reach the engine and trigger UnknownActionStrategy
const UnknownActionSchema = z.object({
  domain: z.string(),
  actionType: z.string(),
  payload: z.record(z.string(), z.unknown()),
  context: ActionContextSchema
});

const KnownActionSchema = FinanceRefundSchema
  .or(FinanceTransferSchema)
  .or(DevOpsDeploySchema)
  .or(DevOpsDropSchema)
  .or(OperationsPermissionsSchema)
  .or(OperationsDeleteAccountSchema);

export const ProposedActionSchema = KnownActionSchema.or(UnknownActionSchema);
