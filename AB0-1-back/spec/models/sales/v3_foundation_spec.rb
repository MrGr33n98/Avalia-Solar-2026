require 'rails_helper'

RSpec.describe 'Sales V3 foundation' do
  it 'define modelos canônicos' do
    expect(Sales::Taxonomy.table_name).to eq('sales_taxonomies')
    expect(Sales::Note.table_name).to eq('sales_notes')
    expect(Sales::AuditLog.table_name).to eq('sales_audit_logs')
    expect(Sales::SolarProject.table_name).to eq('sales_solar_projects')
  end
end
