class AddRoleToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :role, :string, default: 'user'
    add_index :users, :role
    
    # Atualizar usuários existentes
    reversible do |dir|
      dir.up do
        # Definir role padrão para usuários existentes
        User.where(role: nil).update_all(role: 'user')
        
        # Se o usuário tem company_id, é um usuário de empresa
        User.where.not(company_id: nil).update_all(role: 'company')
      end
    end
  end
end
