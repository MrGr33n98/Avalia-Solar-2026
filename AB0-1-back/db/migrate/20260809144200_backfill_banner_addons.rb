class BackfillBannerAddons < ActiveRecord::Migration[7.0]
  def up
    # Migrar BannerOffer para BannerAddon
    execute <<-SQL
      INSERT INTO banner_addons (
        id, name, code, price_cents, duration_days, 
        rules, is_active, created_at, updated_at
      )
      SELECT 
        id, name, 'legacy_' || id::text, price_cents, duration_days,
        rules_json, active, created_at, updated_at
      FROM banner_offers
      ON CONFLICT DO NOTHING;
    SQL

    # Migrar BannerSubscription para BannerAddonSubscription
    # Note: BannerSubscription legado não tinha banner_id not_null,
    # então usamos um fallback (assumindo que seja necessário resolver no app ou usar id 1 por enquanto se houver lixo)
    # Aqui faremos a migração assumindo que iremos resolver banners órfãos via script depois, 
    # ou usando uma query de update que cruza com banner existente.
    # Mas se a constraint de banner_id for NOT NULL na nova tabela, temos um problema se subscriptions não tem banner_id.
    # Verificando schema legado: banner_subscriptions NÃO TEM banner_id.
    # Precisamos contornar isso se existirem subscriptions legadas sem banner associado.
    execute <<-SQL
      INSERT INTO banner_addon_subscriptions (
        id, company_id, banner_id, banner_addon_id, 
        price_paid_cents, discount_cents, starts_at, ends_at, 
        status, payment_provider, payment_reference, 
        activated_at, cancelled_at, addon_snapshot, 
        legacy_source_id, legacy_migration_status,
        created_at, updated_at
      )
      SELECT 
        s.id, s.company_id, 
        NULL,
        s.banner_offer_id,
        COALESCE(o.price_cents, 0), 0, s.starts_at, s.ends_at,
        s.status, s.provider, s.payment_reference,
        s.activated_at, s.canceled_at, '{}'::jsonb,
        s.id, 'requires_assignment',
        s.created_at, s.updated_at
      FROM banner_subscriptions s
      LEFT JOIN banner_offers o ON o.id = s.banner_offer_id
      ON CONFLICT DO NOTHING;
    SQL
    
    # Atualiza a sequence para não quebrar inserts futuros
    execute "SELECT setval('banner_addons_id_seq', (SELECT MAX(id) FROM banner_addons));"
    execute "SELECT setval('banner_addon_subscriptions_id_seq', (SELECT MAX(id) FROM banner_addon_subscriptions));"
  end

  def down
    execute "DELETE FROM banner_addon_subscriptions;"
    execute "DELETE FROM banner_addons;"
  end
end
