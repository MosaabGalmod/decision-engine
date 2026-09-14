import { ProposedAction, AuditLogEntry, DecisionResult } from './types';
import { RiskStrategyRegistry } from './strategies/RiskStrategies';
import { RiskPipeline } from './strategies/RiskModifiers';
import { IReversibilityPolicy } from './reversibility/ReversibilityPolicy';
import { MissingInfoRegistry } from './validation/MissingInfoValidator';
import { ConfidencePipeline } from './confidence/ConfidenceModifiers';
import { DecisionRuleChain } from './rules/DecisionRules';
import { IAuditRepository } from './repository/AuditRepository';
import { IIntegrityService } from './integrity/HmacIntegrityService';
import { THRESHOLDS } from './policy/constants';

export class DecisionEngine {
  constructor(
    private riskRegistry: RiskStrategyRegistry,
    private riskPipeline: RiskPipeline,
    private reversibilityPolicy: IReversibilityPolicy,
    private missingInfoRegistry: MissingInfoRegistry,
    private confidencePipeline: ConfidencePipeline,
    private ruleChain: DecisionRuleChain,
    private auditRepository: IAuditRepository,
    private integrityService: IIntegrityService
  ) {}

  async evaluate(action: ProposedAction): Promise<AuditLogEntry> {
    const riskStrategy = this.riskRegistry.resolve(action);
    const baseRisk = riskStrategy.evaluate(action);
    const riskScore = Math.min(this.riskPipeline.evaluate(baseRisk, action), THRESHOLDS.MAX_RISK);
    
    const reversibility = this.reversibilityPolicy.determine(action);
    const missingInformation = this.missingInfoRegistry.findMissing(action);
    const confidence = this.confidencePipeline.evaluate(action, missingInformation, riskScore);
    
    const { state, reasoning } = this.ruleChain.evaluate({
      riskScore,
      confidence,
      reversibility,
      missingInformation,
      timeOfRequest: action.context.timeOfRequest
    });

    const timestamp = new Date().toISOString();
    const evidenceUsed = [
      `User role: ${action.context.userRole}`,
      `Action type: ${action.actionType} in domain ${action.domain}`,
      `Time of request: ${new Date(action.context.timeOfRequest).toISOString()}`
    ];

    const result: DecisionResult = {
      id: crypto.randomUUID(),
      state,
      confidence,
      riskScore,
      evidenceUsed,
      missingInformation,
      reversibility,
      reasoning,
      timestamp
    };

    const previousHash = this.auditRepository.getLastHash();
    const { id: _id, ...resultWithoutId } = result;
    const actionHash = await this.integrityService.seal(action, resultWithoutId, previousHash);
    
    const auditEntry: AuditLogEntry = {
      ...result,
      action,
      actionHash,
      previousHash
    };
    
    await this.auditRepository.append(auditEntry);
    
    return auditEntry;
  }
}
