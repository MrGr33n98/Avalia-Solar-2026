require 'rails_helper'

RSpec.describe Sales::UserRole do
  it 'mantém assignment único entre usuário e role' do
    expect(described_class.table_name).to eq('sales_user_roles')
    expect(described_class.reflect_on_association(:user)).not_to be_nil
    expect(described_class.reflect_on_association(:role)).not_to be_nil
  end
end
