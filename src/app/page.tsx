'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Shield, Clock, HelpCircle, AlertTriangle, 
  Terminal, Activity, Database, Fingerprint, ArrowRight,
  RefreshCw
} from 'lucide-react';
import { scenarios } from '@/lib/decision-engine/domains';
import { AuditLogEntry } from '@/lib/decision-engine/types';

export default function Dashboard() {
  const [selectedScenario, setSelectedScenario] = useState<string>('safeRefund');
  const [currentDecision, setCurrentDecision] = useState<AuditLogEntry | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ intact: boolean, brokenAtIndex?: number } | null>(null);

  const fetchAuditLog = async () => {
    const res = await fetch('/api/decision');
    const data = await res.json();
    if (data.success) {
      setAuditLog(data.auditLog);
      setVerificationResult(null); // reset verify on new fetch
    }
  };

  const verifyIntegrity = async () => {
    const res = await fetch('/api/decision?verify=1');
    const data = await res.json();
    if (data.success) {
      setVerificationResult(data.verification);
    }
  };

  useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
    fetchAuditLog();
  }, []);

  const runDecision = async (scenarioKey: string) => {
    setLoading(true);
    try {
      // Deep clone to prevent mutating the original static scenarios object
      const payload = JSON.parse(JSON.stringify(scenarios[scenarioKey]));
      
      // update time to now unless it's a specific test case that relies on time
      if (scenarioKey !== 'outOfHoursAccess' && scenarioKey !== 'deliberateFailureTest') {
        payload.context.timeOfRequest = new Date().toISOString();
      }
      
      const res = await fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setCurrentDecision(data.decision);
        fetchAuditLog();
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getDecisionColor = (state: string) => {
    switch(state) {
      case 'execute': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'refuse': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'escalate': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'ask': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'defer': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const getDecisionIcon = (state: string) => {
    switch(state) {
      case 'execute': return <ShieldCheck className="w-8 h-8" />;
      case 'refuse': return <ShieldAlert className="w-8 h-8" />;
      case 'escalate': return <AlertTriangle className="w-8 h-8" />;
      case 'ask': return <HelpCircle className="w-8 h-8" />;
      case 'defer': return <Clock className="w-8 h-8" />;
      default: return <Shield className="w-8 h-8" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 font-sans">
      <header className="border-b border-white/10 bg-zinc-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Fingerprint className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">The Decision Engine</h1>
            <p className="text-xs text-zinc-400">DOO Builders League • MK-BLD-2026-00516</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-zinc-300">System Online</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-white/10 bg-zinc-900/50">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-indigo-400" />
              Proposed Action
            </h2>
            
            <div className="space-y-3">
              <label className="text-sm text-zinc-400">Select Test Scenario:</label>
              <select 
                className="w-full bg-zinc-950 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
              >
                <optgroup label="Finance">
                  <option value="safeRefund">Safe Refund ($50)</option>
                  <option value="missingInfoRefund">Missing Info Refund</option>
                  <option value="highRiskTransfer">High Risk Transfer ($5k)</option>
                </optgroup>
                <optgroup label="DevOps">
                  <option value="safeDeploy">Safe Staging Deploy</option>
                  <option value="destructiveDbDrop">Destructive DB Drop (Prod)</option>
                </optgroup>
                <optgroup label="Operations">
                  <option value="outOfHoursAccess">Out of Hours Access (3 AM)</option>
                </optgroup>
                <optgroup label="Adversarial (Deliberate Failure)">
                  <option value="deliberateFailureTest">Hacker 1M Transfer</option>
                </optgroup>
              </select>
            </div>

            <div className="mt-6">
              <label className="text-sm text-zinc-400 mb-2 block">Payload Preview:</label>
              <pre suppressHydrationWarning className="bg-black border border-white/10 rounded-lg p-4 text-xs text-indigo-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(scenarios[selectedScenario], null, 2)}
              </pre>
            </div>

            <button 
              onClick={() => runDecision(selectedScenario)}
              disabled={loading}
              className="mt-6 w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              Evaluate Action
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {currentDecision ? (
            <div className={`p-6 rounded-xl border ${getDecisionColor(currentDecision.state)} transition-all duration-500`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-black/20 rounded-xl">
                    {getDecisionIcon(currentDecision.state)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold uppercase tracking-wider">{currentDecision.state}</h2>
                    <p className="text-sm opacity-80 mt-1">{currentDecision.reasoning}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-70 mb-1">Execution ID</div>
                  <div className="font-mono text-xs bg-black/20 px-2 py-1 rounded">{currentDecision.id.split('-')[0]}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-xs opacity-70 mb-1">Risk Score</div>
                  <div className="text-2xl font-bold">{currentDecision.riskScore}/100</div>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-xs opacity-70 mb-1">Confidence</div>
                  <div className="text-2xl font-bold">{currentDecision.confidence}%</div>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-xs opacity-70 mb-1">Reversibility</div>
                  <div className="text-lg font-bold capitalize">{currentDecision.reversibility}</div>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-xs opacity-70 mb-1">Missing Info</div>
                  <div className="text-lg font-bold">{currentDecision.missingInformation.length} Items</div>
                </div>
              </div>

              {currentDecision.missingInformation.length > 0 && (
                <div className="mt-4 bg-black/20 p-4 rounded-lg">
                  <div className="text-xs opacity-70 mb-2">Required Information:</div>
                  <ul className="list-disc list-inside text-sm">
                    {currentDecision.missingInformation.map((info, idx) => (
                      <li key={idx}>{info}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-white/5 bg-zinc-900/30 flex flex-col items-center justify-center h-64 text-zinc-500">
              <Activity className="w-12 h-12 mb-4 opacity-50" />
              <p>Awaiting proposed action...</p>
            </div>
          )}

          <div className="p-5 rounded-xl border border-white/10 bg-zinc-900/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                Tamper-Proof Audit Trail
              </h2>
              <div className="flex items-center gap-3">
                {verificationResult && (
                  <span className={`text-xs px-2 py-1 rounded ${verificationResult.intact ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {verificationResult.intact ? 'Chain Intact ✅' : `Broken at #${verificationResult.brokenAtIndex} ❌`}
                  </span>
                )}
                <button onClick={verifyIntegrity} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded transition-colors border border-white/10">
                  Verify Integrity
                </button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {auditLog.length === 0 ? (
                <div className="text-sm text-zinc-500 text-center py-8">Log is empty.</div>
              ) : (
                auditLog.map((log) => (
                  <div key={log.id} className="p-4 rounded-lg border border-white/5 bg-zinc-950 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${getDecisionColor(log.state)}`}>
                          {log.state}
                        </span>
                        <span className="text-xs text-zinc-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-xs font-mono text-zinc-600 truncate max-w-[150px]" title={log.actionHash}>
                        {log.actionHash}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300">{log.reasoning}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-zinc-500">Risk: {log.riskScore}</span>
                      <span className="text-xs text-zinc-500">Confidence: {log.confidence}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
