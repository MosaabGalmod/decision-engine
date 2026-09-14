export function calculateAmountRisk(amount: number): number {
  if (!amount || amount <= 0) return 0;
  
  if (amount <= 100) return 10;
  if (amount <= 1000) return 20;
  
  // Logarithmic scaling for amounts > 1000
  const logAmount = Math.log10(amount);
  
  const risk = 20 + (logAmount - 3) * 15;
  return Math.min(Math.max(Math.round(risk), 10), 90);
}
