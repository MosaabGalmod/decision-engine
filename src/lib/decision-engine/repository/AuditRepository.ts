import { AuditLogEntry, DecisionResult } from '../types';
import { IIntegrityService } from '../integrity/HmacIntegrityService';

export interface IAuditRepository {
  append(entry: AuditLogEntry): Promise<void>;
  getAll(): AuditLogEntry[];
  verifyChainIntegrity(): Promise<{ intact: boolean, brokenAtIndex?: number }>;
  getLastHash(): string;
  clear(): void;
}

export class InMemoryAuditRepository implements IAuditRepository {
  private auditLog: AuditLogEntry[] = [];
  private lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
  
  constructor(private integrityService: IIntegrityService) {}

  async append(entry: AuditLogEntry): Promise<void> {
    this.auditLog.unshift(entry);
    this.lastHash = entry.actionHash;
  }

  getAll(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  getLastHash(): string {
    return this.lastHash;
  }
  
  clear() {
    this.auditLog = [];
    this.lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
  }

  async verifyChainIntegrity(): Promise<{ intact: boolean, brokenAtIndex?: number }> {
    if (this.auditLog.length === 0) return { intact: true };
    
    const chronologicalLog = [...this.auditLog].reverse();
    let expectedPreviousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    
    for (let i = 0; i < chronologicalLog.length; i++) {
      const entry = chronologicalLog[i];
      if (entry.previousHash !== expectedPreviousHash) {
        return { intact: false, brokenAtIndex: this.auditLog.length - 1 - i };
      }
      
      const { actionHash: _ah, previousHash: _ph, action, id: _id, ...resultValues } = entry;
      // Reconstruct the result without ID as we sealed it
      
      const isValid = await this.integrityService.verifyLink(
        action, 
        resultValues as unknown as Omit<DecisionResult, 'id'>, // state, confidence, riskScore, evidenceUsed, missingInformation, reversibility, reasoning, timestamp
        entry.previousHash, 
        entry.actionHash
      );
      
      if (!isValid) {
         return { intact: false, brokenAtIndex: this.auditLog.length - 1 - i };
      }
      expectedPreviousHash = entry.actionHash;
    }
    
    return { intact: true };
  }
}
