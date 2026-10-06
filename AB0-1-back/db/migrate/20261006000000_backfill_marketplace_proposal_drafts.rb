class BackfillMarketplaceProposalDrafts < ActiveRecord::Migration[7.0]
  MARKER_SOURCE = 'backfill_20261006'.freeze

  def up
    execute <<~SQL.squish
      CREATE TEMP TABLE marketplace_proposal_backfill_ids (
        proposal_id bigint PRIMARY KEY
      ) ON COMMIT DROP
    SQL

    execute <<~SQL.squish
      WITH inserted AS (
        INSERT INTO marketplace_proposals (
          lead_id,
          lead_distribution_id,
          company_id,
          buyer_user_id,
          reference,
          status,
          currency,
          total_cents,
          current_version_number,
          created_at,
          updated_at
        )
        SELECT
          distributions.lead_id,
          distributions.id,
          distributions.company_id,
          buyer.id,
          'AS-' ||
            EXTRACT(YEAR FROM COALESCE(distributions.created_at, CURRENT_TIMESTAMP))::integer ||
            '-D' ||
            LPAD(distributions.id::text, 8, '0'),
          'draft',
          'BRL',
          0,
          1,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        FROM lead_distributions distributions
        INNER JOIN leads ON leads.id = distributions.lead_id
        LEFT JOIN LATERAL (
          SELECT users.id
          FROM users
          WHERE users.role = 'review'
            AND LOWER(users.email) = LOWER(leads.email)
          ORDER BY users.id DESC
          LIMIT 1
        ) buyer ON TRUE
        LEFT JOIN marketplace_proposals proposals
          ON proposals.lead_id = distributions.lead_id
          AND proposals.company_id = distributions.company_id
        WHERE distributions.status IN ('sent', 'viewed', 'accepted')
          AND proposals.id IS NULL
        ON CONFLICT (lead_id, company_id) DO NOTHING
        RETURNING id
      )
      INSERT INTO marketplace_proposal_backfill_ids (proposal_id)
      SELECT id FROM inserted
    SQL

    execute <<~SQL.squish
      INSERT INTO marketplace_proposal_versions (
        proposal_id,
        number,
        status,
        title,
        total_cents,
        currency,
        created_at,
        updated_at
      )
      SELECT
        proposal_id,
        1,
        'draft',
        'Proposta em preparação',
        0,
        'BRL',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM marketplace_proposal_backfill_ids
    SQL

    execute <<~SQL.squish
      INSERT INTO marketplace_proposal_events (
        proposal_id,
        event_type,
        metadata,
        occurred_at,
        created_at,
        updated_at
      )
      SELECT
        proposal_id,
        'proposal.prepared',
        '{"source":"#{MARKER_SOURCE}"}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM marketplace_proposal_backfill_ids
    SQL
  end

  def down
    execute <<~SQL.squish
      CREATE TEMP TABLE marketplace_proposal_backfill_rollback_ids (
        proposal_id bigint PRIMARY KEY
      ) ON COMMIT DROP
    SQL

    execute <<~SQL.squish
      INSERT INTO marketplace_proposal_backfill_rollback_ids (proposal_id)
      SELECT proposals.id
      FROM marketplace_proposals proposals
      INNER JOIN marketplace_proposal_versions versions
        ON versions.proposal_id = proposals.id
      INNER JOIN marketplace_proposal_events marker
        ON marker.proposal_id = proposals.id
      WHERE marker.event_type = 'proposal.prepared'
        AND marker.metadata->>'source' = '#{MARKER_SOURCE}'
        AND proposals.status = 'draft'
        AND proposals.total_cents = 0
        AND proposals.published_at IS NULL
        AND proposals.current_version_number = 1
        AND versions.number = 1
        AND versions.status = 'draft'
        AND versions.total_cents = 0
        AND (SELECT COUNT(*) FROM marketplace_proposal_versions other_versions
             WHERE other_versions.proposal_id = proposals.id) = 1
        AND (SELECT COUNT(*) FROM marketplace_proposal_events other_events
             WHERE other_events.proposal_id = proposals.id) = 1
        AND NOT EXISTS (SELECT 1 FROM marketplace_proposal_items items
                        WHERE items.version_id = versions.id)
        AND NOT EXISTS (SELECT 1 FROM marketplace_proposal_terms terms
                        WHERE terms.version_id = versions.id)
        AND NOT EXISTS (SELECT 1 FROM marketplace_proposal_decisions decisions
                        WHERE decisions.proposal_id = proposals.id)
        AND NOT EXISTS (SELECT 1 FROM marketplace_proposal_meetings meetings
                        WHERE meetings.proposal_id = proposals.id)
        AND NOT EXISTS (SELECT 1 FROM marketplace_projects projects
                        WHERE projects.proposal_id = proposals.id)
        AND NOT EXISTS (SELECT 1 FROM conversations
                        WHERE conversations.marketplace_proposal_id = proposals.id)
    SQL

    execute <<~SQL.squish
      DELETE FROM marketplace_proposal_events
      WHERE proposal_id IN (
        SELECT proposal_id FROM marketplace_proposal_backfill_rollback_ids
      )
    SQL
    execute <<~SQL.squish
      DELETE FROM marketplace_proposal_versions
      WHERE proposal_id IN (
        SELECT proposal_id FROM marketplace_proposal_backfill_rollback_ids
      )
    SQL
    execute <<~SQL.squish
      DELETE FROM marketplace_proposals
      WHERE id IN (
        SELECT proposal_id FROM marketplace_proposal_backfill_rollback_ids
      )
    SQL
    execute <<~SQL.squish
      DELETE FROM marketplace_proposal_events
      WHERE event_type = 'proposal.prepared'
        AND metadata->>'source' = '#{MARKER_SOURCE}'
    SQL
  end
end
