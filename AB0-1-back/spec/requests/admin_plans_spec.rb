# frozen_string_literal: true

require 'rails_helper'
require 'nokogiri'

RSpec.describe 'ActiveAdmin Plan feature editor', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:plan) do
    create(
      :plan,
      name: 'Plano Pro Editor Spec',
      price: 1500,
      features_json: PlanFeatureCatalog.defaults_for_tier('pro').merge(
        'custom_ctas' => true, 'whatsapp_contact_button' => true,
        'pricing_table' => false, 'special_offer' => false,
        'show_alternatives' => false, 'sector_question_limit' => 10
      )
    )
  end
  let!(:admin_user) do
    AdminUser.create!(
      email: 'plan-editor-admin@example.com',
      password: 'SecureAdmin123!',
      billing_role: 'super_admin'
    )
  end

  before do
    sign_in admin_user
  end

  describe 'GET /admin/plans/:id/edit' do
    it 'renders all feature checkboxes and typed limit fields' do
      get edit_admin_plan_path(plan)
      expect(response).to have_http_status(:ok)

      page = Nokogiri::HTML(response.body)
      checkbox = page.at_css('input[type="checkbox"][name="plan[plan_feature_fields][custom_ctas]"]')
      whatsapp = page.at_css('input[type="checkbox"][name="plan[plan_feature_fields][whatsapp_contact_button]"]')
      limit = page.at_css('input[type="number"][name="plan[plan_feature_fields][sector_question_limit]"]')
      expect(checkbox).to be_present
      expect(checkbox['checked']).not_to be_nil
      expect(whatsapp).to be_present
      expect(limit).to be_present
      expect(limit['value']).to eq('10')
      expect(page.at_css('#plan-apply-template')).to be_present
      expect(page.at_css('#plan-feature-summary')).to be_present
    end
  end

  describe 'PATCH /admin/plans/:id' do
    it 'saves checkbox off/on, numeric limits and an audit event' do
      expect do
        patch admin_plan_path(plan), params: {
          plan: {
            plan_tier_template: 'pro',
            change_reason: 'Ajuste controlado do catálogo',
            plan_feature_fields: {
              custom_ctas: '0',
              whatsapp_contact_button: '1',
              pricing_table: '0',
              special_offer: '0',
              sector_question_limit: '15',
              show_alternatives: '0'
            }
          }
        }
      end.to change(PlanConfigurationAudit, :count).by(1)

      expect(response).to redirect_to(admin_plan_path(plan))
      plan.reload
      expect(plan.feature_flags['custom_ctas']).to be(false)
      expect(plan.feature_flags['whatsapp_contact_button']).to be(true)
      expect(plan.feature_flags['sector_question_limit']).to eq(15)
      expect(plan.feature_flags['show_alternatives']).to be(false)
      expect(PlanConfigurationAudit.last.change_reason).to eq('Ajuste controlado do catálogo')
    end

    it 'rejects invalid numeric values and keeps the persisted flags unchanged' do
      original = plan.reload.feature_flags.deep_dup
      patch admin_plan_path(plan), params: {
        plan: { plan_tier_template: 'pro', plan_feature_fields: { sector_question_limit: '-4' } }
      }
      expect(plan.reload.feature_flags).to eq(original)
      expect(PlanConfigurationAudit.where(plan: plan)).to be_empty
    end

    it 'rejects unknown feature keys rather than persisting unapproved entitlements' do
      original = plan.reload.feature_flags.deep_dup
      patch admin_plan_path(plan), params: {
        plan: { plan_tier_template: 'pro', plan_feature_fields: { invented_feature: '1' } }
      }
      expect(plan.reload.feature_flags).to eq(original)
    end

    it 'does not erase unrelated settings when a single field is updated' do
      patch admin_plan_path(plan), params: {
        plan: { plan_tier_template: 'pro', plan_feature_fields: { sector_question_limit: '20' } }
      }
      expect(plan.reload.feature_flags['custom_ctas']).to be(true)
      expect(plan.feature_flags['sector_question_limit']).to eq(20)
    end

    it 'denies changes for accounts without billing super-admin privileges' do
      admin_user.update!(billing_role: 'support')
      original = plan.reload.feature_flags.deep_dup
      patch admin_plan_path(plan), params: {
        plan: { plan_feature_fields: { custom_ctas: '0' } }
      }
      expect(plan.reload.feature_flags).to eq(original)
    end
  end
end
