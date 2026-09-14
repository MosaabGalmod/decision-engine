import { describe, it, expect, beforeEach } from 'vitest';
import { defaultDecisionEngine, auditRepository } from '../container';
import { ProposedAction, AuditLogEntry } from '../types';

describe('Decision Engine - Boundaries & Security', () => {
  beforeEach(() => {
    auditRepository.clear();
  });

  it('Boundary: Unknown action type returns risk 100 and escalate/refuse', async () => {
    const action: unknown = {
      domain: 'finance',
      actionType: 'some_unknown_action',
      payload: {},
      context: {
        userId: 'u-1',
        userRole: 'admin',
        ipAddress: '127.0.0.1',
        timeOfRequest: '2026-09-14T12:00:00.000Z'
      }
    };
    
    const result = await defaultDecisionEngine.evaluate(action as ProposedAction);
    expect(result.riskScore).toBe(100);
    expect(result.state).toBe('refuse'); 
  });

  it('Boundary: deploy to production is irreversible', async () => {
    const action: ProposedAction = {
      domain: 'devops',
      actionType: 'deploy',
      payload: { environment: 'production', prNumber: '1', reviewerId: 'rev-1' },
      context: {
        userId: 'u-1',
        userRole: 'admin',
        ipAddress: '127.0.0.1',
        timeOfRequest: '2026-09-14T12:00:00.000Z'
      }
    };
    
    const result = await defaultDecisionEngine.evaluate(action);
    expect(result.reversibility).toBe('irreversible');
    // base risk is 70. Reversible=false -> Escalate
    expect(result.state).toBe('escalate');
  });

  it('Boundary: Refund exact $1000 and $10000', async () => {
    const createRefund = (amount: number): ProposedAction => ({
      domain: 'finance',
      actionType: 'refund',
      payload: { amount, reason: 'Test', receiptId: 'REC-1' },
      context: {
        userId: 'u-1',
        userRole: 'admin',
        ipAddress: '127.0.0.1',
        timeOfRequest: '2026-09-14T12:00:00.000Z'
      }
    });

    const res1000 = await defaultDecisionEngine.evaluate(createRefund(1000));
    expect(res1000.riskScore).toBe(30); 

    const res10000 = await defaultDecisionEngine.evaluate(createRefund(10000));
    expect(res10000.riskScore).toBe(45); 
  });

  it('Audit Integrity: Verify Chain works', async () => {
    const action: ProposedAction = {
      domain: 'finance',
      actionType: 'refund',
      payload: { amount: 50, reason: 'Test', receiptId: 'REC-1' },
      context: {
        userId: 'u-1',
        userRole: 'admin',
        ipAddress: '127.0.0.1',
        timeOfRequest: '2026-09-14T12:00:00.000Z'
      }
    };
    
    await defaultDecisionEngine.evaluate(action);
    await defaultDecisionEngine.evaluate(action);
    
    const verifyPass = await auditRepository.verifyChainIntegrity();
    expect(verifyPass.intact).toBe(true);

    const log = auditRepository.getAll();
    const tamperedEntry = { ...log[0], riskScore: 999 };
    
    // Test helper bypass to tamper with log
    (auditRepository as unknown as { auditLog: AuditLogEntry[] }).auditLog[0] = tamperedEntry;
    
    const verifyFail = await auditRepository.verifyChainIntegrity();
    expect(verifyFail.intact).toBe(false);
  });
});
