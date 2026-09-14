export type DecisionState = 'execute' | 'ask' | 'defer' | 'escalate' | 'refuse';

export interface ActionContext {
  userId: string;
  userRole: 'admin' | 'manager' | 'operator' | 'system';
  ipAddress: string;
  deviceId?: string;
  timeOfRequest: string; // ISO string
  location?: string;
}

export interface ProposedAction {
  domain: 'finance' | 'devops' | 'operations';
  actionType: string;
  payload: Record<string, unknown>;
  context: ActionContext;
}

export interface DecisionResult {
  id: string; // unique execution id
  state: DecisionState;
  confidence: number; // 0 to 100
  riskScore: number; // 0 to 100
  evidenceUsed: string[];
  missingInformation: string[];
  reversibility: 'reversible' | 'irreversible';
  reasoning: string;
  timestamp: string;
}

export interface AuditLogEntry extends DecisionResult {
  action: ProposedAction; // Storing the original action for hash verification
  actionHash: string; // HMAC-SHA256 of the ProposedAction + timestamp + previousHash
  previousHash: string; // for the chain
}
