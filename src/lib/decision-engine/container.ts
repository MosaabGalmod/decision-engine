import { DecisionEngine } from './DecisionEngine';
import { RiskStrategyRegistry, FinanceRiskStrategy, DevOpsRiskStrategy, OperationsRiskStrategy } from './strategies/RiskStrategies';
import { RiskPipeline } from './strategies/RiskModifiers';
import { DefaultReversibilityPolicy } from './reversibility/ReversibilityPolicy';
import { MissingInfoRegistry, FinanceMissingInfoValidator, DevOpsMissingInfoValidator } from './validation/MissingInfoValidator';
import { ConfidencePipeline } from './confidence/ConfidenceModifiers';
import { DecisionRuleChain } from './rules/DecisionRules';
import { InMemoryAuditRepository } from './repository/AuditRepository';
import { HmacSha256IntegrityService } from './integrity/HmacIntegrityService';

const riskRegistry = new RiskStrategyRegistry();
riskRegistry.register('finance', new FinanceRiskStrategy());
riskRegistry.register('devops', new DevOpsRiskStrategy());
riskRegistry.register('operations', new OperationsRiskStrategy());

const riskPipeline = new RiskPipeline();

const reversibilityPolicy = new DefaultReversibilityPolicy();

const missingInfoRegistry = new MissingInfoRegistry();
missingInfoRegistry.register('finance', new FinanceMissingInfoValidator());
missingInfoRegistry.register('devops', new DevOpsMissingInfoValidator());

const confidencePipeline = new ConfidencePipeline();
const ruleChain = new DecisionRuleChain();
const integrityService = new HmacSha256IntegrityService();
export const auditRepository = new InMemoryAuditRepository(integrityService);

export const defaultDecisionEngine = new DecisionEngine(
  riskRegistry,
  riskPipeline,
  reversibilityPolicy,
  missingInfoRegistry,
  confidencePipeline,
  ruleChain,
  auditRepository,
  integrityService
);
