import { ProposedAction } from '../types';

export interface IMissingInfoValidator {
  findMissing(action: ProposedAction): string[];
}

export class FinanceMissingInfoValidator implements IMissingInfoValidator {
  findMissing(action: ProposedAction): string[] {
    const missing: string[] = [];
    if (action.actionType === 'refund') {
      if (!action.payload.reason) missing.push('Refund reason');
      if (!action.payload.receiptId) missing.push('Original receipt ID');
    }
    return missing;
  }
}

export class DevOpsMissingInfoValidator implements IMissingInfoValidator {
  findMissing(action: ProposedAction): string[] {
    const missing: string[] = [];
    if (action.actionType === 'deploy') {
      if (!action.payload.prNumber) missing.push('Pull Request Number');
      if (!action.payload.reviewerId) missing.push('Reviewer ID');
    }
    return missing;
  }
}

export class MissingInfoRegistry {
  private validators = new Map<string, IMissingInfoValidator>();

  register(domain: string, validator: IMissingInfoValidator) {
    this.validators.set(domain, validator);
  }

  findMissing(action: ProposedAction): string[] {
    const validator = this.validators.get(action.domain);
    if (!validator) return [];
    return validator.findMissing(action);
  }
}
