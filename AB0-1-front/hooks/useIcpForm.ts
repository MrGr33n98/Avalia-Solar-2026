import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { icpProfileSchema, type IcpProfileFormData } from '@/schemas/icp-profile-schema';
import type { IcpProfile } from '@/types/icp';

interface UseIcpFormProps {
  initialData: IcpProfile | null;
  onSubmit: (data: IcpProfileFormData) => Promise<void>;
}

export function useIcpForm({ initialData, onSubmit }: UseIcpFormProps) {
  const form = useForm<IcpProfileFormData>({
    resolver: zodResolver(icpProfileSchema),
    defaultValues: {
      min_monthly_bill: 0,
      max_monthly_bill: null,
      min_system_kwp: 0,
      max_system_kwp: null,
      min_ev_chargers_count: 0,
      min_ev_vehicles_count: null,
      ev_timeframe: '',
      ev_budget: '',
      ev_active: false,
      strictness_level: 'balanced',
      auto_reject_out_of_icp: false,
      notify_only_high_match: false,
      nationwide: false,
      target_audiences: [],
      preferred_roof_types: [],
      ev_charger_types: [],
      ev_applications: [],
      target_cities: [],
      target_states: [],
      target_regions: [],
      decision_profiles: [],
      motivations: [],
      price_sensitivity: null,
      urgency: null,
      min_ticket: null,
      max_ticket: null,
    },
  });

  // Reset form values when initial data loads
  useEffect(() => {
    if (initialData) {
      form.reset({
        min_monthly_bill: initialData.min_monthly_bill || 0,
        max_monthly_bill: initialData.max_monthly_bill ?? null,
        min_system_kwp: initialData.min_system_kwp || 0,
        max_system_kwp: initialData.max_system_kwp ?? null,
        min_ev_chargers_count: initialData.min_ev_chargers_count || 0,
        min_ev_vehicles_count: initialData.min_ev_vehicles_count ?? null,
        ev_timeframe: initialData.ev_timeframe || '',
        ev_budget: initialData.ev_budget || '',
        ev_active: !!initialData.ev_active,
        strictness_level: initialData.strictness_level || 'balanced',
        auto_reject_out_of_icp: !!initialData.auto_reject_out_of_icp,
        notify_only_high_match: !!initialData.notify_only_high_match,
        nationwide: !!initialData.nationwide,
        target_audiences: initialData.target_audiences || [],
        preferred_roof_types: initialData.preferred_roof_types || [],
        ev_charger_types: initialData.ev_charger_types || [],
        ev_applications: initialData.ev_applications || [],
        target_cities: initialData.target_cities || [],
        target_states: initialData.target_states || [],
        target_regions: initialData.target_regions || [],
        decision_profiles: initialData.decision_profiles || [],
        motivations: initialData.motivations || [],
        price_sensitivity: initialData.price_sensitivity ?? null,
        urgency: initialData.urgency ?? null,
        min_ticket: initialData.min_ticket ?? null,
        max_ticket: initialData.max_ticket ?? null,
      });
    }
  }, [initialData, form]);

  const handleFormSubmit = form.handleSubmit((data) => {
    return onSubmit(data);
  });

  return {
    form,
    onSubmit: handleFormSubmit,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
    reset: () => {
      if (initialData) {
        form.reset(initialData as any);
      } else {
        form.reset();
      }
    },
  };
}
