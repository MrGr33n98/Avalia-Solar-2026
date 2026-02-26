# Migration para ranking meritocrático e patrocínio inteligente (Sprint 1)
class AddPriorityScoreAndSponsoredToCompanies < ActiveRecord::Migration[7.0]
  def change
    # priority_score: Campo base para o ranking (ajustado via Admin)
    add_column :companies, :priority_score, :integer, default: 0, null: false
    
    # sponsored: Flag para destaque pago
    add_column :companies, :sponsored, :boolean, default: false, null: false
    
    # Índices para performance em queries de listagem ordenadas
    add_index :companies, :priority_score
    add_index :companies, :sponsored
  end
end
