import { ProposedAction } from '../types';
import { THRESHOLDS } from '../policy/constants';

export interface IRiskModifier {
  apply(risk: number, action: ProposedAction): number;
}

export class RoleRiskModifier implements IRiskModifier {
  apply(risk: number, action: ProposedAction): number {
    if (action.context.userRole === 'admin') {
      return risk;
    } else if (action.context.userRole === 'manager') {
      return risk + 10;
    } else {
      // operator or unknown
      return risk + 20;
    }
  }
}

export class TimeRiskModifier implements IRiskModifier {
  apply(risk: number, action: ProposedAction): number {
    const hour = new Date(action.context.timeOfRequest).getHours();
    if (hour < THRESHOLDS.OFF_HOURS_END || hour >= THRESHOLDS.OFF_HOURS_START) {
      return risk + 15; // Off-hours adds risk
    }
    return risk;
  }
}

export class RiskPipeline {
  private modifiers: IRiskModifier[] = [];

  constructor() {
    this.modifiers.push(new RoleRiskModifier());
    this.modifiers.push(new TimeRiskModifier());
  }

  evaluate(baseRisk: number, action: ProposedAction): number {
    let risk = baseRisk;
    for (const mod of this.modifiers) {
      risk = mod.apply(risk, action);
    }
    return Math.min(risk, THRESHOLDS.MAX_RISK);
  }
}
