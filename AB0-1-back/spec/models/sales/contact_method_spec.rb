# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::ContactMethod, type: :model do
  let(:company) { create(:company) }
  let(:owner) { create(:user, role: :admin, company: company) }
  let(:account) { Sales::Account.create!(name: 'Solar Co', owner: owner, company_id: company.id) }
  let(:contact) { account.contacts.create!(first_name: 'Carlos', last_name: 'Ferreira') }

  describe 'normalizations & validations' do
    it 'normalizes email to lowercase and stripped' do
      method = contact.contact_methods.build(kind: 'email', value: '  CARLOS.Solar@Exemplo.COM.BR ')
      method.valid?
      expect(method.normalized_value).to eq('carlos.solar@exemplo.com.br')
    end

    it 'normalizes phone adding country code if 10 or 11 digits' do
      method = contact.contact_methods.build(kind: 'phone', value: '(11) 98765-4321')
      method.valid?
      expect(method.normalized_value).to eq('+5511987654321')
    end

    it 'normalizes url with https' do
      method = contact.contact_methods.build(kind: 'linkedin', value: 'linkedin.com/in/carlos-solar')
      method.valid?
      expect(method.normalized_value).to eq('https://linkedin.com/in/carlos-solar')
    end

    it 'assigns company_id automatically from contact account' do
      method = contact.contact_methods.create!(kind: 'email', value: 'teste@solar.com')
      expect(method.company_id).to eq(company.id)
    end
  end

  describe 'Services' do
    it 'creates primary contact method and updates contact mirror column' do
      method = Sales::ContactMethods::Upsert.call(
        contact: contact,
        attributes: { kind: 'email', value: 'primario@solar.com', is_primary: true }
      )

      expect(method.is_primary?).to be true
      expect(contact.reload.email).to eq('primario@solar.com')
    end

    it 'prevents duplicate active contact method on the same contact' do
      Sales::ContactMethods::Upsert.call(
        contact: contact,
        attributes: { kind: 'email', value: 'duplicado@solar.com' }
      )

      expect do
        Sales::ContactMethods::Upsert.call(
          contact: contact,
          attributes: { kind: 'email', value: 'DUPLICADO@solar.com' }
        )
      end.to raise_error(Sales::ContactMethods::Upsert::DuplicateError)
    end

    it 'archives method and promotes replacement if primary' do
      m1 = Sales::ContactMethods::Upsert.call(
        contact: contact,
        attributes: { kind: 'email', value: 'um@solar.com', is_primary: true }
      )
      m2 = Sales::ContactMethods::Upsert.call(
        contact: contact,
        attributes: { kind: 'email', value: 'dois@solar.com', is_primary: false }
      )

      expect(contact.reload.email).to eq('um@solar.com')

      Sales::ContactMethods::Archive.call(contact_method: m1, replacement_id: m2.id)

      expect(m1.reload.archived_at).not_to be_nil
      expect(m1.is_primary?).to be false
      expect(m2.reload.is_primary?).to be true
      expect(contact.reload.email).to eq('dois@solar.com')
    end
  end
end
