# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Transactional Outbox Engine (Wave 3)', type: :service do
  self.use_transactional_tests = false

  let!(:user) { create(:user, email: "outbox_user_#{SecureRandom.hex(4)}@example.com") }
  let!(:company) { create(:company, name: "Outbox Test Solar #{SecureRandom.hex(4)}") }
  let!(:pipeline) { Sales::Pipeline.create!(name: 'Standard Pipeline', key: "std_#{SecureRandom.hex(4)}", active: true) }
  let!(:stage1) { pipeline.stages.create!(name: 'Lead', key: "lead_#{SecureRandom.hex(3)}", position: 1, probability: 10) }
  let!(:stage2) { pipeline.stages.create!(name: 'Qualified', key: "qual_#{SecureRandom.hex(3)}", position: 2, probability: 40) }
  let!(:account) { Sales::Account.create!(name: 'Account Outbox', owner: user) }
  let!(:opportunity) do
    account.opportunities.create!(
      name: 'Deal Outbox',
      pipeline: pipeline,
      stage: stage1,
      owner: user,
      stage_entered_at: Time.current
    )
  end

  before(:each) do
    DomainEvent.destroy_all rescue nil
    opportunity.update!(name: 'Deal Outbox', stage: stage1) rescue nil
  end

  after(:all) do
    DomainEvent.destroy_all rescue nil
    Sales::Opportunity.where(name: 'Deal Outbox').destroy_all rescue nil
    Sales::Account.where(name: 'Account Outbox').destroy_all rescue nil
    Sales::Stage.where(sales_pipeline: pipeline).destroy_all rescue nil
    Sales::Pipeline.where(name: 'Standard Pipeline').destroy_all rescue nil
    Company.where("name LIKE 'Outbox Test Solar%'").destroy_all rescue nil
    User.where("email LIKE 'outbox_user_%'").destroy_all rescue nil
  end

  describe '1. Transaction Atomicity (Rollback vs Commit)' do
    it 'rolls back Outbox event when the surrounding business transaction is aborted' do
      expect do
        ActiveRecord::Base.transaction do
          opportunity.update!(name: 'Name Changed in Aborted Tx')
          Outbox.record!(
            event_type: 'sales.opportunity.updated',
            aggregate: opportunity,
            payload: { name: opportunity.name }
          )
          raise ActiveRecord::Rollback
        end
      end.not_to change(DomainEvent, :count)

      expect(opportunity.reload.name).to eq('Deal Outbox')
      expect(DomainEvent.where(aggregate_id: opportunity.id)).to be_empty
    end

    it 'persists both domain mutation and Outbox event atomically on transaction commit' do
      expect do
        ActiveRecord::Base.transaction do
          opportunity.update!(name: 'Name Committed')
          Outbox.record!(
            event_type: 'sales.opportunity.updated',
            aggregate: opportunity,
            payload: { name: 'Name Committed' }
          )
        end
      end.to change(DomainEvent, :count).by(1)

      expect(opportunity.reload.name).to eq('Name Committed')
      event = DomainEvent.last
      expect(event.event_type).to eq('sales.opportunity.updated')
      expect(event.status).to eq('pending')
      expect(event.payload['name']).to eq('Name Committed')
    end
  end

  describe '2. Event Envelope & Payload Safety' do
    it 'creates canonical envelope with UUID, version, timestamps and filters sensitive credentials' do
      event = Outbox.record!(
        event_type: 'user.created',
        aggregate: user,
        payload: {
          user_id: user.id,
          email: user.email,
          password: 'SecretPassword123!',
          api_key: 'sk_live_123456789',
          jwt_token: 'eyJhbGciOiJIUzI1NiIsIn...'
        },
        metadata: {
          source_ip: '127.0.0.1',
          auth_token: 'bearer_token_abc'
        }
      )

      expect(event.event_id).to match(/\A[0-9a-f\-]{36}\z/)
      expect(event.event_version).to eq(1)
      expect(event.occurred_at).to be_present
      expect(event.status).to eq('pending')

      # Sensitive data filtering
      expect(event.payload['password']).to eq('[FILTERED]')
      expect(event.payload['api_key']).to eq('[FILTERED]')
      expect(event.payload['jwt_token']).to eq('[FILTERED]')
      expect(event.payload['data']['email']).to eq(user.email)
      expect(event.metadata['auth_token']).to eq('[FILTERED]')
      expect(event.metadata['source_ip']).to eq('127.0.0.1')
    end

    it 'automatically derives tenant company_id from aggregate' do
      event = Outbox.record!(
        event_type: 'company.updated',
        aggregate: company,
        payload: { name: company.name }
      )

      expect(event.company_id).to eq(company.id)
    end
  end

  describe '3. Outbox Dispatcher & Lifecycle State Machine' do
    it 'claims pending events, dispatches via router, and marks them completed' do
      event = Outbox.record!(
        event_type: 'sales.opportunity.stage_changed',
        aggregate: opportunity,
        payload: { opportunity_id: opportunity.id, from_stage_id: stage1.id, to_stage_id: stage2.id }
      )

      result = Outbox::DispatcherService.call(batch_size: 10)
      expect(result[:processed]).to eq(1)
      expect(result[:succeeded]).to eq(1)
      expect(result[:failed]).to eq(0)

      event.reload
      expect(event.status).to eq('completed')
      expect(event.processed_at).to be_present
      expect(event.attempts).to eq(0)
    end

    it 'handles dispatcher errors gracefully, records last_error, and increments attempts' do
      event = Outbox.record!(
        event_type: 'failing.event',
        aggregate: opportunity,
        payload: { fail: true }
      )

      allow(Outbox::EventRouter).to receive(:dispatch).and_raise(RuntimeError, 'Downstream subscriber failed')

      result = Outbox::DispatcherService.call(batch_size: 10)
      expect(result[:processed]).to eq(1)
      expect(result[:succeeded]).to eq(0)
      expect(result[:failed]).to eq(1)

      event.reload
      expect(event.status).to eq('failed')
      expect(event.attempts).to eq(1)
      expect(event.last_error).to include('Downstream subscriber failed')
    end

    it 'treats events with >= 5 attempts as poison/dead-letter and skips them in processable' do
      event = Outbox.record!(
        event_type: 'poison.event',
        aggregate: opportunity,
        payload: { poison: true }
      )
      event.update!(status: 'failed', attempts: 5, last_error: 'Permanent poison error')

      expect(DomainEvent.processable.where(id: event.id)).to be_empty
      expect(DomainEvent.dead_letter.where(id: event.id)).to exist

      result = Outbox::DispatcherService.call(batch_size: 10)
      expect(result[:processed]).to eq(0)
      expect(event.reload.attempts).to eq(5)
    end
  end

  describe '4. Multi-Worker Concurrency Safety' do
    it 'allows concurrent workers to claim distinct events without duplicate dispatch' do
      event1 = Outbox.record!(event_type: 'sales.opp.1', aggregate: opportunity, payload: { i: 1 })
      event2 = Outbox.record!(event_type: 'sales.opp.2', aggregate: opportunity, payload: { i: 2 })
      event3 = Outbox.record!(event_type: 'sales.opp.3', aggregate: opportunity, payload: { i: 3 })
      event4 = Outbox.record!(event_type: 'sales.opp.4', aggregate: opportunity, payload: { i: 4 })

      threads = []
      results = []

      2.times do
        threads << Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            res = Outbox::DispatcherService.call(batch_size: 2)
            results << res
          end
        end
      end

      threads.each(&:join)

      total_processed = results.sum { |r| r[:processed] }
      expect(total_processed).to eq(4)
      expect([event1, event2, event3, event4].map(&:reload).map(&:status).uniq).to eq(['completed'])
    end
  end

  describe '5. Sales CRM Stage Change Integration' do
    it 'atomically changes stage and records canonical outbox event' do
      expect do
        Sales::Opportunities::ChangeStage.call(
          opportunity: opportunity,
          stage: stage2,
          actor: user
        )
      end.to change(DomainEvent, :count).by(1)

      expect(opportunity.reload.stage).to eq(stage2)
      event = DomainEvent.last
      expect(event.event_type).to eq('sales.opportunity.stage_changed')
      expect(event.aggregate_id).to eq(opportunity.id)
      expect(event.payload['to_stage_id']).to eq(stage2.id)
    end
  end

  describe '6. Lead Conversion Integration' do
    it 'atomically converts lead, creates account/contact, and records canonical outbox event' do
      lead_opp = account.opportunities.create!(
        name: 'Lead To Convert',
        pipeline: pipeline,
        stage: stage1,
        owner: user
      )

      expect do
        Sales::LeadConversionService.call(
          opportunity: lead_opp,
          actor: user,
          contact_params: { first_name: 'Lead', email: 'lead@test.com' }
        )
      end.to change(DomainEvent, :count).by(1)

      event = DomainEvent.last
      expect(event.event_type).to eq('sales.lead.converted')
      expect(event.payload['opportunity_id']).to eq(lead_opp.id)
      expect(event.payload['account_id']).to be_present
    end
  end
end
