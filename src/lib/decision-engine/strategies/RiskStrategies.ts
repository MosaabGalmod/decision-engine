import { ProposedAction } from '../types';
import { THRESHOLDS } from '../policy/constants';
import { calculateAmountRisk } from '../shared/amountRisk';

export interface IRiskStrategy {
  supports(actionType: string): boolean;
  evaluate(action: ProposedAction): number;
}

export class FinanceRiskStrategy implements IRiskStrategy {
  supports(actionType: string): boolean {
    return ['refund', 'transfer'].includes(actionType);
  }

  evaluate(action: ProposedAction): number {
    let score = 10;
    
    if (action.actionType === 'refund') {
      const amount = (action.payload as { amount?: number }).amount || 0;
      score += calculateAmountRisk(amount);
    } 
    else if (action.actionType === 'transfer') {
      score += 20;
      const amount = (action.payload as { amount?: number }).amount || 0;
      score += calculateAmountRisk(amount);
      
      if ((action.payload as { destination?: string }).destination === 'external') {
        score += 20;
      }
    }
    return score;
  }
}

export class DevOpsRiskStrategy implements IRiskStrategy {
  supports(actionType: string): boolean {
    return ['deploy', 'drop_database'].includes(actionType);
  }

  evaluate(action: ProposedAction): number {
    if (action.actionType === 'deploy') {
      const env = (action.payload as { environment?: string }).environment;
      if (env === 'production') return 70;
      if (env === 'staging') return 20;
      return 10;
    }
    if (action.actionType === 'drop_database') {
      return THRESHOLDS.MAX_RISK;
    }
    return 10;
  }
}

export class OperationsRiskStrategy implements IRiskStrategy {
  supports(actionType: string): boolean {
    return ['delete_account', 'modify_permissions'].includes(actionType);
  }

  evaluate(action: ProposedAction): number {
    let score = 10;
    if (action.actionType === 'delete_account') {
      score += 70;
    } else if (action.actionType === 'modify_permissions') {
      score += 50;
    }
    return score;
  }
}

export class UnknownActionStrategy implements IRiskStrategy {
  supports(actionType: string): boolean {
    return true;
  }

  evaluate(_action: ProposedAction): number {
    return THRESHOLDS.MAX_RISK;
  }
}

export class RiskStrategyRegistry {
  private strategies = new Map<string, IRiskStrategy>();
  private fallbackStrategy = new UnknownActionStrategy();

  register(domain: string, strategy: IRiskStrategy) {
    this.strategies.set(domain, strategy);
  }

  resolve(action: ProposedAction): IRiskStrategy {
    const strategy = this.strategies.get(action.domain);
    if (!strategy || !strategy.supports(action.actionType)) {
      return this.fallbackStrategy;
    }
    return strategy;
  }
}
