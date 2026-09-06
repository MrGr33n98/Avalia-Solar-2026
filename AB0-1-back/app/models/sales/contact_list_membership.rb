# frozen_string_literal: true

module Sales
  class ContactListMembership < ApplicationRecord
    self.table_name = 'sales_contact_list_memberships'

    belongs_to :company, class_name: '::Company'
    belongs_to :list, class_name: 'Sales::ContactList', foreign_key: :sales_contact_list_id, counter_cache: :contacts_count
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id

    validates :sales_contact_list_id, uniqueness: { scope: :sales_contact_id, message: 'Contato já está na lista.' }
    validate :validate_tenant_integrity

    private

    def validate_tenant_integrity
      return unless list && contact && company_id

      if list.company_id != company_id || contact.company_id != company_id
        errors.add(:company_id, 'Violação de isolamento de tenant entre lista, contato e empresa.')
      end
    end
  end
end
