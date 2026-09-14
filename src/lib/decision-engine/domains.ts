import { ProposedAction } from './types';

// Pre-defined scenarios to demonstrate the engine
export const scenarios: Record<string, ProposedAction> = {
  safeRefund: {
    domain: 'finance',
    actionType: 'refund',
    payload: { amount: 50, reason: 'Item defective', receiptId: 'REC-123' },
    context: {
      userId: 'u-123',
      userRole: 'operator',
      ipAddress: '192.168.1.5',
      timeOfRequest: '2026-09-14T12:00:00.000Z'
    }
  },
  missingInfoRefund: {
    domain: 'finance',
    actionType: 'refund',
    payload: { amount: 50 }, 
    context: {
      userId: 'u-123',
      userRole: 'operator',
      ipAddress: '192.168.1.5',
      timeOfRequest: '2026-09-14T12:00:00.000Z'
    }
  },
  highRiskTransfer: {
    domain: 'finance',
    actionType: 'transfer',
    payload: { amount: 5000, destination: 'external', accountId: 'ACC-999' },
    context: {
      userId: 'u-456',
      userRole: 'manager',
      ipAddress: '10.0.0.5',
      timeOfRequest: '2026-09-14T12:00:00.000Z'
    }
  },
  safeDeploy: {
    domain: 'devops',
    actionType: 'deploy',
    payload: { environment: 'staging', prNumber: 'PR-42', reviewerId: 'rev-7' },
    context: {
      userId: 'dev-1',
      userRole: 'operator',
      ipAddress: '10.0.0.10',
      timeOfRequest: '2026-09-14T12:00:00.000Z'
    }
  },
  destructiveDbDrop: {
    domain: 'devops',
    actionType: 'drop_database',
    payload: { dbName: 'prod_main' },
    context: {
      userId: 'dev-99',
      userRole: 'admin',
      ipAddress: '10.0.0.1',
      timeOfRequest: '2026-09-14T12:00:00.000Z'
    }
  },
  outOfHoursAccess: {
    domain: 'operations',
    actionType: 'modify_permissions',
    payload: { targetUser: 'u-123', newRole: 'admin' },
    context: {
      userId: 'u-789',
      userRole: 'manager',
      ipAddress: '192.168.1.100',
      timeOfRequest: '2026-09-14T03:00:00.000Z' 
    }
  },
  deliberateFailureTest: {
    domain: 'finance',
    actionType: 'transfer',
    payload: { amount: 1000000, destination: 'external', accountId: 'OFFSHORE-001' },
    context: {
      userId: 'hacker-1',
      userRole: 'operator', 
      ipAddress: '103.45.67.89',
      location: 'unknown',
      timeOfRequest: '2026-09-14T02:00:00.000Z' 
    }
  }
};
