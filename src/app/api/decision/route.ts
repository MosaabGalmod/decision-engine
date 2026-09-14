import { NextResponse } from 'next/server';
import { ProposedActionSchema, BaseActionSchema } from '@/lib/decision-engine/schema';
import { defaultDecisionEngine, auditRepository } from '@/lib/decision-engine/container';
import { ProposedAction } from '@/lib/decision-engine/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Stage 1: Validate basic structure
    const baseParsed = BaseActionSchema.safeParse(body);
    if (!baseParsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload structure', details: baseParsed.error.errors }, { status: 400 });
    }

    // Stage 2: Try to validate known action types
    const parsed = ProposedActionSchema.safeParse(baseParsed.data);
    if (!parsed.success) {
      const knownActionTypes = ['refund', 'transfer', 'deploy', 'drop_database', 'modify_permissions', 'delete_account'];
      if (knownActionTypes.includes(baseParsed.data.actionType)) {
        // It's a known action type, but the payload is malformed (e.g., missing amount) -> REFUSE 400
        return NextResponse.json({ success: false, error: 'Invalid payload for known action', details: parsed.error.errors }, { status: 400 });
      }
      
      // It's an unknown action type -> Pass to engine (will hit UnknownActionStrategy)
      const decision = await defaultDecisionEngine.evaluate(baseParsed.data as ProposedAction);
      return NextResponse.json({ success: true, decision });
    }

    // Known and valid action type
    const decision = await defaultDecisionEngine.evaluate(parsed.data as ProposedAction);
    
    return NextResponse.json({ success: true, decision });
  } catch (error: unknown) {
    console.error("Decision Engine Error:", error);
    return NextResponse.json({
      success: false,
      error: 'An internal error occurred during decision evaluation.'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const verify = searchParams.get('verify');
  
  if (verify === '1') {
    const verification = await auditRepository.verifyChainIntegrity();
    return NextResponse.json({
      success: true,
      verification
    });
  }
  
  const log = auditRepository.getAll();
  return NextResponse.json({
    success: true,
    auditLog: log
  });
}
