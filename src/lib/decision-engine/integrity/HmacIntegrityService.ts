import { ProposedAction, DecisionResult } from '../types';

export interface IIntegrityService {
  seal(action: ProposedAction, result: Omit<DecisionResult, 'id'>, previousSeal: string): Promise<string>;
  verifyLink(action: ProposedAction, result: Omit<DecisionResult, 'id'>, previousSeal: string, seal: string): Promise<boolean>;
}

export class HmacSha256IntegrityService implements IIntegrityService {
  private secretKey: string;

  constructor() {
    const envSecret = process.env.AUDIT_HMAC_SECRET;
    if (!envSecret) {
      console.warn('WARNING: AUDIT_HMAC_SECRET not set. Using insecure demo fallback key.');
      this.secretKey = 'decision-engine-secure-secret-key-2026';
    } else {
      this.secretKey = envSecret;
    }
  }

  private async generateHMAC(data: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(this.secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async seal(action: ProposedAction, result: Omit<DecisionResult, 'id'>, previousSeal: string): Promise<string> {
    const dataToSign = JSON.stringify(action) + JSON.stringify(result) + previousSeal;
    return this.generateHMAC(dataToSign);
  }

  async verifyLink(action: ProposedAction, result: Omit<DecisionResult, 'id'>, previousSeal: string, seal: string): Promise<boolean> {
    const expectedSeal = await this.seal(action, result, previousSeal);
    return expectedSeal === seal;
  }
}
