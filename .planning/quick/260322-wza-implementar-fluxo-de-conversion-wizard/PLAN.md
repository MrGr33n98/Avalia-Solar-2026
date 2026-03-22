# Quick Task Plan: Conversion Wizard & Identification (FASE C)

## Task 1: Rastreio do Wizard de Captação
- **File:** `AB0-1-front/components/QuoteWizardModal.tsx`
- **Actions:** 
  1. Add imports for `trackWizardStart`, `trackWizardContactSubmitted`, `trackLeadSuccess` from `@/lib/analytics/consolidated`.
  2. Call `trackWizardStart` in the `open-quote-wizard` event handler.
  3. Call `trackWizardContactSubmitted(lead_id, category_id)` when the lead is successfully created at the end of Step 7.
  4. Call `trackLeadSuccess` upon successful OTP verification (`handleVerifyOtp`).

## Task 2: Identificação de Sessão (Auth)
- **File:** `AB0-1-front/contexts/AuthContext.tsx`
- **Actions:**
  1. Ensure `identify` is correctly linking user profile. (It's already there on user change!)
  2. Implement `reset()` inside the `logout` function to clear the session context and prevent cross-identity tracking.

## Task 3: Eventos de Engajamento & Confiança
- **File:** `AB0-1-front/app/companies/[id]/components/CompanySidebar.tsx`
- **Actions:**
  1. Track `faq_interaction` using `trackFaqEngagement` (It already uses `trackQuestion`, but ensure it's mapped logically if needed, wait, `useFaqExpand` inside `useIntentTracking` already uses `faq_interaction`! So this is technically already met! Will verify).
  2. (Optional based on review/favorite components).
