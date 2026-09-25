# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::EmailSequences::EnrollmentProcessor do
  let!(:company) { create(:company, email: 'vendas@avaliasolar.com.br') }
  let!(:owner) { create(:user, company: company) }
  let!(:account) { create(:sales_account, company: company, owner: owner) }
  let!(:contact) do
    Sales::Contact.create!(account: account, first_name: 'Contato', email: 'synthetic@example.test')
  end
  let!(:sequence) { Sales::EmailSequence.create!(company: company, user: owner, name: 'Prospecção sintética') }
  let!(:template) do
    Sales::EmailTemplate.create!(company: company, user: owner, name: 'Primeiro contato',
                                 subject_template: 'Olá', body_html: '<p>Olá</p>', status: 'active')
  end
  let!(:step) do
    Sales::EmailSequenceStep.create!(email_sequence: sequence, email_template: template,
                                     position: 0, delay_days: 0, step_type: 'email')
  end
  let!(:enrollment) do
    Sales::EmailSequenceEnrollment.create!(company: company, sequence: sequence, contact: contact,
                                           account: account, owner: owner, status: 'active', current_step: 0,
                                           enrolled_at: Time.current, next_action_at: Time.current)
  end

  it 'cria uma única mensagem e enfileira o envio da etapa de e-mail' do
    allow(Sales::Messaging::SendingGate).to receive(:enabled?).and_return(true)
    expect(Sales::SendEmailJob).to receive(:perform_later).once

    described_class.process(enrollment)
    described_class.process(enrollment)

    message = Sales::EmailMessage.find_by!(sales_email_sequence_enrollment_step_id: enrollment.steps.first.id)
    expect(message.status).to eq('queued')
    expect(enrollment.reload.next_action_at).to be_nil
    expect(enrollment.steps.first.attempt_count).to eq(1)
  end

  it 'pausa sem perder a etapa se o envio estiver desabilitado' do
    allow(Sales::Messaging::SendingGate).to receive(:enabled?).and_return(false)

    described_class.process(enrollment)

    expect(enrollment.reload.status).to eq('paused')
    expect(enrollment.stop_reason).to eq('email_sending_disabled')
    expect(enrollment.steps.sole.status).to eq('queued')
    expect(enrollment.steps.sole.email_message).to be_nil
  end

  it 'cria tarefa manual da cadência e avança somente após a conclusão' do
    step.update!(step_type: 'task', email_template: nil)

    described_class.process(enrollment)

    task = Sales::Task.find_by!(sales_email_sequence_enrollment_step_id: enrollment.steps.first.id)
    expect(task.owner_id).to eq(owner.id)
    expect(task.status).to eq('pending')
    expect(enrollment.reload.next_action_at).to be_nil
    expect(enrollment.steps.first.status).to eq('task_pending')

    task.update!(status: 'completed', completed_at: Time.current)
    described_class.task_completed(task)

    expect(enrollment.reload.status).to eq('completed')
    expect(enrollment.steps.first.reload.status).to eq('completed')
  end

  it 'interrompe a cadência se houver supressão antes de executar a etapa' do
    Sales::EmailSuppression.create!(company: company, email: contact.email, reason: 'unsubscribe')

    described_class.process(enrollment)

    expect(enrollment.reload.status).to eq('stopped')
    expect(enrollment.stop_reason).to eq('suppressed')
    expect(enrollment.steps).to be_empty
  end
end
