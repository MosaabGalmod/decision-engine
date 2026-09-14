import { NextResponse } from 'next/server';
import { ProposedAction } from '@/lib/decision-engine/types';
import { defaultDecisionEngine, auditRepository } from '@/lib/decision-engine/container';
import { ProposedActionSchema } from '@/lib/decision-engine/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const validationResult = ProposedActionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action payload (Validation Failed)',
        details: validationResult.error.issues
      }, { status: 400 });
    }
    
    const action = validationResult.data as ProposedAction;

    // SECURITY NOTE: In production, do not trust client for userRole/timeOfRequest.
    // Derive them from a verified JWT/session instead of the request body.
    
    const auditEntry = await defaultDecisionEngine.evaluate(action);
    
    return NextResponse.json({
      success: true,
      decision: auditEntry,
    });
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
