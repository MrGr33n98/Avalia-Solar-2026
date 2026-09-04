require 'rails_helper'

RSpec.describe Sales::EmailSuppression, type: :model do
  subject(:suppression) { build(:sales_email_suppression) }

  it { is_expected.to be_valid }

  it 'normaliza e-mail para lowercase' do
    suppression.email = '  TESTE@EXEMPLO.COM '
    expect(suppression.email).to eq('teste@exemplo.com')
  end

  it 'aceita apenas motivos conhecidos' do
    suppression.reason = 'unknown'
    expect(suppression).not_to be_valid
  end
end
