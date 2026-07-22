import { useMemo } from 'react';
import type { IcpProfile } from '@/types/icp';
import type { IcpProfileFormData } from '@/schemas/icp-profile-schema';

export function useIcpScorePreview(values: Partial<IcpProfileFormData> | undefined) {
  return useMemo(() => {
    if (!values) {
      return {
        score: 70,
        quality: 'Média',
        volume: 'Médio',
        conversion: '+25%',
        active_criteria_count: 0,
        total_criteria_count: 12,
      } as const;
    }

    let score = 50; // Base score
    let activeCriteria = 0;
    const totalCriteria = 12;

    // 1. Faturamento mínimo (Fatura)
    if (values.min_monthly_bill && values.min_monthly_bill > 0) {
      activeCriteria++;
      if (values.min_monthly_bill > 10000) score += 10;
      else if (values.min_monthly_bill > 3000) score += 7;
      else score += 4;
    }

    // 2. Potência do Sistema (kWp)
    if (values.min_system_kwp && values.min_system_kwp > 0) {
      activeCriteria++;
      if (values.min_system_kwp > 50) score += 8;
      else if (values.min_system_kwp > 10) score += 5;
      else score += 3;
    }

    // 3. Mobilidade Elétrica
    if (values.ev_active) {
      activeCriteria++;
      score += 4;
      if (values.min_ev_chargers_count && values.min_ev_chargers_count > 0) {
        score += 4;
      }
      if (values.ev_charger_types && values.ev_charger_types.length > 0) {
        score += 3;
      }
    }

    // 4. Tipos de Imóveis
    if (values.target_audiences && values.target_audiences.length > 0) {
      activeCriteria++;
      score += Math.min(6, values.target_audiences.length * 2.5);
    }

    // 5. Tipo de Telhado / Estrutura
    if (values.preferred_roof_types && values.preferred_roof_types.length > 0) {
      activeCriteria++;
      score += Math.min(6, values.preferred_roof_types.length * 2);
    }

    // 6. Localização / Estados
    if (values.nationwide) {
      activeCriteria++;
      score += 15;
    } else if (values.target_states && values.target_states.length > 0) {
      activeCriteria++;
      score += Math.min(12, values.target_states.length * 1.5);
    }

    // 7. Decisor
    if (values.decision_profiles && values.decision_profiles.length > 0) {
      activeCriteria++;
      score += 3;
    }

    // 8. Urgência
    if (values.urgency) {
      activeCriteria++;
      score += 4;
    }

    // 9. Nível de Rigor
    if (values.strictness_level === 'strict') {
      score += 8;
    } else if (values.strictness_level === 'balanced') {
      score += 4;
    } else {
      score -= 5;
    }

    // Garante limites [0, 100]
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    // Métricas auxiliares baseadas no score
    let quality: 'Alta' | 'Média' | 'Baixa' = 'Média';
    let volume: 'Alto' | 'Médio' | 'Baixo' = 'Médio';
    let conversion = '+25%';

    if (finalScore >= 80) {
      quality = 'Alta';
      volume = 'Baixo';
      conversion = '+42%';
    } else if (finalScore < 60) {
      quality = 'Baixa';
      volume = 'Alto';
      conversion = '+12%';
    }

    return {
      score: finalScore,
      quality,
      volume,
      conversion,
      active_criteria_count: activeCriteria,
      total_criteria_count: totalCriteria,
    };
  }, [values]);
}
