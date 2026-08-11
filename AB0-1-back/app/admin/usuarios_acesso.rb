# frozen_string_literal: true

ActiveAdmin.register_page 'Usuarios Acesso' do
  menu priority: 10, label: 'Usuários & Acesso'

  content title: 'Usuários & Acesso' do
    tabs = [
      ['Visão Geral', admin_usuarios_acesso_path],
      ['Usuários Finais', admin_users_path],
      ['Administradores', admin_admin_users_path],
      ['Acessos a Produtos', admin_product_accesses_path]
    ]

    div class: 'usuarios-acesso-tabs', style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;' do
      tabs.each_with_index do |(label, path), index|
        link_to label, path, class: "button #{index.zero? ? 'primary' : ''}"
      end
      nil
    end

    columns do
      column do
        panel 'Usuários Cadastrados' do
          h2 number_with_delimiter(User.count, delimiter: '.')
          span 'Total de parceiros, instaladores e leads'
        end
      end
      column do
        panel 'Administradores' do
          h2 number_with_delimiter(AdminUser.count, delimiter: '.')
          span 'Operadores internos da plataforma'
        end
      end
      column do
        panel 'Acessos a Produtos' do
          h2 number_with_delimiter(ProductAccess.count, delimiter: '.')
          span 'Controle de aquisições de produtos físicos/digitais'
        end
      end
    end

    columns do
      column do
        panel 'Usuários Criados Recentemente' do
          table_for User.order(created_at: :desc).limit(10) do
            column('Nome') { |user| user.name }
            column('E-mail') { |user| user.email }
            column('Admin?') { |user| status_tag(user.admin? ? 'Sim' : 'Não') }
            column('Data de Cadastro') { |user| user.created_at&.strftime('%d/%m/%Y %H:%M') || '—' }
            column('Ações') { |user| link_to 'Ver Perfil', admin_user_path(user) }
          end
        end
      end

      column do
        panel 'Administradores Ativos' do
          table_for AdminUser.order(updated_at: :desc).limit(5) do
            column('E-mail') { |admin| admin.email }
            column('2FA Habilitado?') { |admin| status_tag(admin.otp_required_for_login? ? 'Sim' : 'Não') }
            column('Ações') { |admin| link_to 'Editar', edit_admin_admin_user_path(admin) }
          end
        end
      end
    end
  end
end
