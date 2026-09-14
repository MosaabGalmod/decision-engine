import { ProposedAction } from '../types';
import { THRESHOLDS } from '../policy/constants';

export interface IConfidenceModifier {
  apply(confidence: number, _action: ProposedAction, _missing: string[], _risk: number): number;
}

export class MissingInfoModifier implements IConfidenceModifier {
  apply(confidence: number, action: ProposedAction, missing: string[], risk: number): number {
    return confidence - (missing.length * 20);
  }
}

export class RoleRiskModifier implements IConfidenceModifier {
  apply(confidence: number, action: ProposedAction, missing: string[], risk: number): number {
    if (risk > THRESHOLDS.RISK_ESCALATE && action.context.userRole === 'operator') {
      return confidence - 30;
    }
    return confidence;
  }
}

export class LocationModifier implements IConfidenceModifier {
  apply(confidence: number, action: ProposedAction, missing: string[], risk: number): number {
    if (action.context.location === 'unknown') {
      return confidence - 15;
    }
    return confidence;
  }
}

export class ConfidencePipeline {
  private modifiers: IConfidenceModifier[] = [];

  constructor() {
    this.modifiers.push(new MissingInfoModifier());
    this.modifiers.push(new RoleRiskModifier());
    this.modifiers.push(new LocationModifier());
  }

  evaluate(action: ProposedAction, missing: string[], risk: number): number {
    let confidence = THRESHOLDS.MAX_CONFIDENCE;
    for (const mod of this.modifiers) {
      confidence = mod.apply(confidence, action, missing, risk);
    }
    return Math.max(Math.min(confidence, THRESHOLDS.MAX_CONFIDENCE), THRESHOLDS.MIN_CONFIDENCE);
  }
}
