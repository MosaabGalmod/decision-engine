import { ProposedAction } from '../types';

export interface IReversibilityPolicy {
  determine(action: ProposedAction): 'reversible' | 'irreversible';
}

export class DefaultReversibilityPolicy implements IReversibilityPolicy {
  determine(action: ProposedAction): 'reversible' | 'irreversible' {
    const irreversibleActions = ['drop_database', 'delete_account', 'transfer'];
    if (irreversibleActions.includes(action.actionType)) {
      return 'irreversible';
    }
    
    if (action.actionType === 'deploy' && (action.payload as { environment?: string }).environment === 'production') {
      return 'irreversible';
    }
    
    if (action.actionType === 'refund' && ((action.payload as { amount?: number }).amount || 0) > 50000) {
      return 'irreversible';
    }
    
    return 'reversible';
  }
}
