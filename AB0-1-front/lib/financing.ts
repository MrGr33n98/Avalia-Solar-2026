export type AmortizationType = 'price' | 'sac';

export interface FinancingSimulationInput {
  amount: number;
  downPaymentPercent: number;
  termMonths: number;
  interestRateMonthly: number;
  graceMonths?: number;
  amortizationType?: AmortizationType;
}

export interface FinancingSimulationResult {
  financedAmount: number;
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
}

const toRate = (value: number) => Math.max(0, value) / 100;
const round2 = (value: number) => Math.round(value * 100) / 100;

export function simulateFinancing({
  amount,
  downPaymentPercent,
  termMonths,
  interestRateMonthly,
  graceMonths = 0,
  amortizationType = 'price',
}: FinancingSimulationInput): FinancingSimulationResult {
  const principal = Math.max(0, amount) * (1 - Math.max(0, downPaymentPercent) / 100);
  const months = Math.max(1, Math.round(termMonths));
  const rate = toRate(interestRateMonthly);
  const grace = Math.max(0, Math.round(graceMonths));

  const balanceAfterGrace = rate > 0 ? principal * Math.pow(1 + rate, grace) : principal;

  let monthlyPayment = 0;
  let totalPaid = 0;

  if (amortizationType === 'sac') {
    const amortization = balanceAfterGrace / months;
    const firstInstallment = amortization + balanceAfterGrace * rate;
    const lastBalance = Math.max(0, balanceAfterGrace - amortization * (months - 1));
    const lastInstallment = amortization + lastBalance * rate;

    monthlyPayment = firstInstallment;
    totalPaid = ((firstInstallment + lastInstallment) / 2) * months;
  } else {
    if (rate === 0) {
      monthlyPayment = balanceAfterGrace / months;
      totalPaid = monthlyPayment * months;
    } else {
      const factor =
        (rate * Math.pow(1 + rate, months)) /
        (Math.pow(1 + rate, months) - 1);
      monthlyPayment = balanceAfterGrace * factor;
      totalPaid = monthlyPayment * months;
    }
  }

  const totalInterest = totalPaid - principal;

  return {
    financedAmount: round2(principal),
    monthlyPayment: round2(monthlyPayment),
    totalPaid: round2(totalPaid),
    totalInterest: round2(totalInterest),
  };
}
