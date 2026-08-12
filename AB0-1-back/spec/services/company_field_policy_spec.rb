require 'rails_helper'

RSpec.describe CompanyFieldPolicy do
  let(:company) { double('Company', feature_access: {}, inferred_plan_tier: 'free') }
  subject(:policy) { described_class.new(company) }

  describe '#decision' do
    context 'when field belongs to identity or contact (free/direct update)' do
      it 'allows direct update for description' do
        result = policy.decision(:description)
        expect(result).to include(
          field_group: 'description',
          editable: true,
          direct_update: true,
          requires_approval: false,
          requires_verification: false,
          reason_code: 'DIRECT_UPDATE',
          field: 'description'
        )
      end

      it 'allows direct update for working_hours' do
        result = policy.decision(:working_hours)
        expect(result).to include(
          field_group: 'business_hours',
          editable: true,
          direct_update: true,
          requires_approval: false,
          requires_verification: false,
          reason_code: 'DIRECT_UPDATE',
          field: 'working_hours'
        )
      end

      it 'allows direct update for contact fields' do
        %w[website phone phone_alt whatsapp email_public instagram facebook linkedin].each do |field|
          result = policy.decision(field)
          expect(result).to include(
            field_group: 'contact',
            editable: true,
            direct_update: true,
            requires_approval: false,
            requires_verification: false,
            reason_code: 'DIRECT_UPDATE',
            field: field
          )
        end
      end

      it 'allows direct update for public name' do
        result = policy.decision(:name)
        expect(result).to include(
          field_group: 'identity',
          editable: true,
          direct_update: true,
          requires_approval: false,
          requires_verification: false,
          reason_code: 'DIRECT_UPDATE',
          field: 'name'
        )
      end
    end

    context 'when field is legal_identity (CNPJ)' do
      it 'requires approval and verification, no direct update' do
        result = policy.decision(:cnpj)
        expect(result).to include(
          field_group: 'legal_identity',
          editable: true,
          direct_update: false,
          requires_approval: true,
          requires_verification: true,
          reason_code: 'VERIFICATION_REQUIRED',
          field: 'cnpj'
        )
      end
    end

    context 'when field is location (address, city, state)' do
      it 'requires approval but no verification, no direct update' do
        %w[address city state].each do |field|
          result = policy.decision(field)
          expect(result).to include(
            field_group: 'location',
            editable: true,
            direct_update: false,
            requires_approval: true,
            requires_verification: false,
            reason_code: 'LOCATION_REVIEW_REQUIRED',
            field: field
          )
        end
      end
    end

    context 'when field is media (logo, banner)' do
      context 'when company has profile_media_direct_update enabled in feature_access' do
        let(:company) do
          double('Company',
                 feature_access: { 'profile_media_direct_update' => { 'state' => 'enabled' } },
                 inferred_plan_tier: 'pro')
        end

        it 'allows direct update' do
          result = policy.decision(:logo)
          expect(result).to include(
            field_group: 'media',
            editable: true,
            direct_update: true,
            requires_approval: false,
            reason_code: 'ENTITLEMENT_GRANTED',
            field: 'logo'
          )
        end
      end

      context 'when company does not have entitlement but is enterprise' do
        let(:company) { double('Company', feature_access: {}, inferred_plan_tier: 'enterprise') }

        it 'allows direct update via tier fallback' do
          result = policy.decision(:banner)
          expect(result).to include(
            field_group: 'media',
            editable: true,
            direct_update: true,
            requires_approval: false,
            reason_code: 'ENTITLEMENT_GRANTED',
            field: 'banner'
          )
        end
      end

      context 'when company is free and has no entitlement' do
        let(:company) { double('Company', feature_access: {}, inferred_plan_tier: 'free') }

        it 'requires approval' do
          result = policy.decision(:logo)
          expect(result).to include(
            field_group: 'media',
            editable: true,
            direct_update: false,
            requires_approval: true,
            reason_code: 'APPROVAL_REQUIRED',
            field: 'logo'
          )
        end
      end
    end

    context 'when field is service_area or categories (limit dependent)' do
      it 'allows direct update when below limit' do
        %w[coverage_states coverage_cities categories].each do |field|
          result = policy.decision(field, exceeds_limit: false)
          expect(result).to include(
            editable: true,
            direct_update: true,
            requires_approval: false,
            reason_code: 'DIRECT_UPDATE',
            field: field
          )
        end
      end

      it 'denies direct update and requires approval when limit is exceeded' do
        %w[coverage_states coverage_cities categories].each do |field|
          result = policy.decision(field, exceeds_limit: true)
          expect(result).to include(
            editable: true,
            direct_update: false,
            requires_approval: true,
            reason_code: 'LIMIT_EXCEEDED',
            field: field
          )
        end
      end
    end

    context 'when field is unknown' do
      it 'fails safe by denying direct update and requiring verification/approval' do
        result = policy.decision(:invalid_field_name)
        expect(result).to include(
          field_group: nil,
          editable: false,
          direct_update: false,
          requires_approval: true,
          requires_verification: true,
          reason_code: 'UNKNOWN_FIELD',
          field: 'invalid_field_name'
        )
      end
    end
  end
end
