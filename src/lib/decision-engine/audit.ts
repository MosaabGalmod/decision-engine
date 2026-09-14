import { DecisionResult, ProposedAction, AuditLogEntry } from './types';

// Simple in-memory audit log for the demo
// In production, this MUST be an append-only store like Postgres or a Blockchain ledger
let auditLog: AuditLogEntry[] = [];
let lastHash: string = '0000000000000000000000000000000000000000000000000000000000000000';

// A secret key for HMAC to prevent tampering (In production, load from env vars)
const HMAC_SECRET = process.env.AUDIT_HMAC_SECRET || 'decision-engine-secure-secret-key-2026';

async function generateHMAC(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  
  // Import the secret as a CryptoKey
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Generate the HMAC signature
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  
  // Convert ArrayBuffer to Hex String
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function logDecision(action: ProposedAction, result: DecisionResult): Promise<AuditLogEntry> {
  // We hash the original action data, the timestamp, and the previous hash to create a chain
  const actionString = JSON.stringify(action);
  const dataToSign = actionString + result.timestamp + lastHash;
  
  // Use HMAC instead of plain SHA256 to ensure authenticity
  const actionHash = await generateHMAC(dataToSign, HMAC_SECRET);
  
  const entry: AuditLogEntry = {
    ...result,
    action, // We store the original action so the hash can be verified later
    actionHash,
    previousHash: lastHash
  };
  
  auditLog.unshift(entry); // Add to beginning (for UI display purposes)
  lastHash = actionHash;
  
  return entry;
}

export function getAuditLog(): AuditLogEntry[] {
  return [...auditLog];
}

export function clearAuditLog() {
  auditLog = [];
  lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
}
