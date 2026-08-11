# frozen_string_literal: true

ActiveAdmin.register_page 'Sistema' do
  menu priority: 15, label: 'Sistema'

  content title: 'Configurações do Sistema' do
    tabs = [
      ['Visão Geral', admin_sistema_path],
      ['Pendências de Alteração', admin_pending_changes_path],
      ['Logs de Auditoria', admin_audit_logs_path]
    ]

    div class: 'sistema-tabs', style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;' do
      tabs.each_with_index do |(label, path), index|
        link_to label, path, class: "button #{index.zero? ? 'primary' : ''}"
      end
      nil
    end

    columns do
      column do
        panel 'Alterações Pendentes' do
          h2 number_with_delimiter(PendingChange.where(status: 'pending').count, delimiter: '.')
          span 'Moderações cadastrais em análise'
        end
      end
      column do
        panel 'Logs de Auditoria' do
          h2 number_with_delimiter(PaperTrail::Version.count, delimiter: '.')
          span 'Ações gravadas pelo PaperTrail'
        end
      end
      column do
        panel 'Parâmetros Globais' do
          h2 'Ativos'
          span 'Ambiente e feature flags'
        end
      end
    end

    columns do
      column do
        panel 'Mudanças Pendentes Recentes' do
          table_for PendingChange.order(created_at: :desc).limit(10) do
            column('Empresa') { |change| change.company&.name || 'Empresa não identificada' }
            column('Status') { |change| status_tag change.status }
            column('Data do Pedido') { |change| change.created_at.strftime('%d/%m/%Y %H:%M') }
            column('Ações') { |change| link_to 'Analisar', admin_pending_change_path(change) }
          end
        end
      end

      column do
        panel 'Histórico Recente de Auditoria (Logs)' do
          table_for PaperTrail::Version.order(created_at: :desc).limit(10) do
            column('Tipo') { |version| version.item_type }
            column('Evento') { |version| version.event }
            column('Autor') do |version|
              whodunnit = version.whodunnit
              if whodunnit.to_s.match?(/^\d+$/)
                User.find_by(id: whodunnit)&.name || "User ID #{whodunnit}"
              else
                whodunnit.presence || 'Sistema/Job'
              end
            end
            column('Criado em') { |version| version.created_at.strftime('%d/%m/%Y %H:%M') }
            column('Ações') { |version| link_to 'Ver Log', admin_audit_log_path(version) }
          end
        end
      end
    end
  end
end
