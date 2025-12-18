class AddTemporalAndStatusConstraints < ActiveRecord::Migration[7.0]
  def up
    # 1. Add status columns/indexes (safe on SQLite/PostgreSQL)
    add_index :forum_questions, :status unless index_exists?(:forum_questions, :status)

    unless column_exists?(:campaign_reviews, :status)
      add_column :campaign_reviews, :status, :string, default: 'draft'
      add_index :campaign_reviews, :status
    end

    # 2. Constraints (PostgreSQL-only)
    if postgresql?
      unless constraint_exists?(:campaign_reviews, 'chk_campaign_reviews_period')
        execute <<~SQL
          ALTER TABLE campaign_reviews
          ADD CONSTRAINT chk_campaign_reviews_period
          CHECK (start_at IS NULL OR end_at IS NULL OR end_at >= start_at)
        SQL
      end

      add_status_constraint(:forum_questions, 'forum_questions_status_allowed', %w[draft published archived]) if column_exists?(:forum_questions, :status)
      add_status_constraint(:campaign_reviews, 'campaign_reviews_status_allowed', %w[draft active finished canceled]) if column_exists?(:campaign_reviews, :status)
    end
  end

  def down
    if postgresql?
      if constraint_exists?(:campaign_reviews, 'chk_campaign_reviews_period')
        execute 'ALTER TABLE campaign_reviews DROP CONSTRAINT chk_campaign_reviews_period'
      end
      if constraint_exists?(:forum_questions, 'forum_questions_status_allowed')
        execute 'ALTER TABLE forum_questions DROP CONSTRAINT forum_questions_status_allowed'
      end
      if constraint_exists?(:campaign_reviews, 'campaign_reviews_status_allowed')
        execute 'ALTER TABLE campaign_reviews DROP CONSTRAINT campaign_reviews_status_allowed'
      end
    end
    if index_exists?(:forum_questions, :status)
      remove_index :forum_questions, :status
    end
    if index_exists?(:campaign_reviews, :status)
      remove_index :campaign_reviews, :status
    end
    if column_exists?(:campaign_reviews, :status)
      remove_column :campaign_reviews, :status
    end
  end

  private

  def constraint_exists?(table, name)
    query = <<~SQL
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name='#{table}' AND constraint_name='#{name}'
    SQL
    result = execute(query) rescue []
    result.any?
  end

  def add_status_constraint(table, constraint_name, allowed_values)
    return if constraint_exists?(table, constraint_name)

    values_sql = allowed_values.map { |v| "'#{v}'" }.join(', ')
    execute <<~SQL
      ALTER TABLE #{table}
      ADD CONSTRAINT #{constraint_name}
      CHECK (status IS NULL OR status IN (#{values_sql}))
    SQL
  end

  def postgresql?
    ActiveRecord::Base.connection.adapter_name =~ /PostgreSQL/i
  end
end
