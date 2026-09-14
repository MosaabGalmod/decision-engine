import { DecisionState } from '../types';
import { THRESHOLDS } from '../policy/constants';

export interface EvaluationContext {
  riskScore: number;
  confidence: number;
  reversibility: 'reversible' | 'irreversible';
  missingInformation: string[];
  timeOfRequest: string;
}

export interface IDecisionRule {
  evaluate(ctx: EvaluationContext): DecisionState | null;
  getReasoning(): string;
}

export class RefuseRule implements IDecisionRule {
  evaluate(ctx: EvaluationContext): DecisionState | null {
    if (ctx.riskScore >= THRESHOLDS.RISK_REFUSE) return 'refuse';
    return null;
  }
  getReasoning() { return 'Action violates critical security policies (Risk too high).'; }
}

export class EscalateRule implements IDecisionRule {
  evaluate(ctx: EvaluationContext): DecisionState | null {
    if (ctx.riskScore >= THRESHOLDS.RISK_ESCALATE || (ctx.riskScore > THRESHOLDS.RISK_ASK_DEFER_MODERATE && ctx.reversibility === 'irreversible')) {
      return 'escalate';
    }
    return null;
  }
  getReasoning() { return 'High risk or irreversible action requires human oversight.'; }
}

export class AskRule implements IDecisionRule {
  evaluate(ctx: EvaluationContext): DecisionState | null {
    if (ctx.missingInformation.length > 0 || ctx.confidence < THRESHOLDS.CONFIDENCE_LOW) {
      return 'ask';
    }
    return null;
  }
  getReasoning() { return 'Missing critical context or confidence is too low.'; }
}

export class DeferRule implements IDecisionRule {
  evaluate(ctx: EvaluationContext): DecisionState | null {
    const hour = new Date(ctx.timeOfRequest).getHours();
    if (hour < THRESHOLDS.OFF_HOURS_END || hour > THRESHOLDS.OFF_HOURS_START) {
      return 'defer';
    }
    return null;
  }
  getReasoning() { return 'Action requested outside of normal business hours. Deferred until next window.'; }
}

export class ExecuteRule implements IDecisionRule {
  evaluate(_ctx: EvaluationContext): DecisionState | null {
    return 'execute';
  }
  getReasoning() { return 'Action is within safe parameters and confidence is high.'; }
}

export class DecisionRuleChain {
  private rules: IDecisionRule[] = [];

  constructor() {
    this.rules.push(new RefuseRule());
    this.rules.push(new EscalateRule());
    this.rules.push(new AskRule());
    this.rules.push(new DeferRule());
    this.rules.push(new ExecuteRule());
  }

  evaluate(ctx: EvaluationContext): { state: DecisionState, reasoning: string } {
    for (const rule of this.rules) {
      const state = rule.evaluate(ctx);
      if (state) {
        let reasoning = rule.getReasoning();
        if (state === 'ask' && ctx.missingInformation.length > 0) {
           reasoning = `Missing critical context: ${ctx.missingInformation.join(', ')} or confidence is too low.`;
        }
        return { state, reasoning };
      }
    }
    return { state: 'execute', reasoning: 'Fallback' };
  }
}
