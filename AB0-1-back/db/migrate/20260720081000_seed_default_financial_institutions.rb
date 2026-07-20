class SeedDefaultFinancialInstitutions < ActiveRecord::Migration[7.0]
  DEFAULT_BANKS = [
    { name: 'Banco do Brasil', slug: 'banco-do-brasil', featured: true, display_order: 1 },
    { name: 'Caixa Econômica Federal', slug: 'caixa', featured: true, display_order: 2 },
    { name: 'Bradesco', slug: 'bradesco', featured: true, display_order: 3 },
    { name: 'Santander', slug: 'santander', featured: true, display_order: 4 },
    { name: 'Sicredi', slug: 'sicredi', featured: true, display_order: 5 },
    { name: 'Sicoob', slug: 'sicoob', featured: true, display_order: 6 },
    { name: 'BV Financeira', slug: 'bv-financeira', featured: true, display_order: 7 },
    { name: 'Solfácil', slug: 'solfacil', featured: true, display_order: 8 }
  ].freeze

  def up
    DEFAULT_BANKS.each do |bank|
      FinancialInstitution.find_or_create_by!(slug: bank[:slug]) do |fi|
        fi.name = bank[:name]
        fi.featured = bank[:featured]
        fi.display_order = bank[:display_order]
        fi.active = true
      end
    end
  end

  def down
    FinancialInstitution.where(slug: DEFAULT_BANKS.map { |b| b[:slug] }).destroy_all
  end
end
