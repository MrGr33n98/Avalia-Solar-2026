# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Reporting::TaskPerformanceQuery do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:account) { Sales::Account.create!(name: 'Conta Teste Tarefa', owner: user, company_id: company.id) }

  before do
    # Tarefa concluída no prazo
    Sales::Task.create!(
      sales_account: account,
      owner: user,
      task_type: 'call',
      title: 'Ligar para cliente',
      status: 'completed',
      due_at: 2.days.ago,
      completed_at: 3.days.ago
    )

    # Tarefa concluída com atraso
    Sales::Task.create!(
      sales_account: account,
      owner: user,
      task_type: 'email',
      title: 'Enviar proposta',
      status: 'completed',
      due_at: 3.days.ago,
      completed_at: 1.day.ago
    )
  end

  it 'calcula corretamente a taxa de tarefas concluídas no prazo' do
    result = described_class.call(user: user)

    expect(result[:total]).to eq(2)
    expect(result[:completed]).to eq(2)
    expect(result[:completed_on_time]).to eq(1)
    expect(result[:completed_late]).to eq(1)
    expect(result[:on_time_rate]).to eq(50.0)
  end
end
