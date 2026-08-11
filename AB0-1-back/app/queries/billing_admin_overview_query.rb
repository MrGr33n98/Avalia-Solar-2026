# frozen_string_literal: true

class BillingAdminOverviewQuery
  def call
    subscriptions = Billing::CompanySubscription

    {
      public_plans: Plan.where(is_public: true).count,
      active_subscriptions: subscriptions.active_saas.count,
      trials: subscriptions.where(status: 'trialing').count,
      past_due: subscriptions.past_due.count,
      scheduled_cancellations: subscriptions.where(cancel_at_period_end: true).count,
      companies_without_subscription: companies_without_subscription,
      legacy_subscriptions: SubscriptionPlan.count,
      mrr_amount: subscriptions.mrr_estimate,
      feature_count: PlanFeatureCatalog.known_keys.size,
      latest_subscriptions: subscriptions.includes(:company, :plan).order(created_at: :desc).limit(10)
    }
  end

  private

  def companies_without_subscription
    Company.left_joins(:billing_company_subscriptions)
           .where(billing_company_subscriptions: { id: nil })
           .count
  end
end
