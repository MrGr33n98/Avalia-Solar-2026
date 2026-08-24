# frozen_string_literal: true

required_schema = {
  creator_leads: %i[
    creator_user_id
    publication_id
    visitor_id
    name
    email
    intent
    consent_at
    status
    admin_notes
    handled_at
  ],
  creator_tree_blocks: %i[
    reviewer_id
    company_id
    publication_id
    block_type
    title
    position
    active
    metadata
    clicks_count
  ]
}.freeze

required_indexes = {
  creator_leads: [
    { columns: %i[creator_user_id created_at] },
    { columns: [:status] },
    { columns: %i[creator_user_id status created_at], name: 'idx_creator_leads_inbox' }
  ],
  creator_tree_blocks: [
    { columns: %i[reviewer_id position] },
    { columns: %i[reviewer_id active] },
    { columns: [:block_type] }
  ]
}.freeze

required_migrations = %w[
  20260814122000
  20260814124000
  20260814125000
  20260817200000
].freeze

required_foreign_keys = {
  creator_leads: {
    creator_user_id: :users,
    publication_id: :reviewer_publications,
    visitor_id: :users
  },
  creator_tree_blocks: {
    reviewer_id: :reviewer_profiles,
    company_id: :companies,
    publication_id: :reviewer_publications
  }
}.freeze

connection = ActiveRecord::Base.connection
errors = []

required_schema.each do |table, columns|
  unless connection.data_source_exists?(table)
    errors << "tabela ausente: #{table}"
    next
  end

  columns.each do |column|
    errors << "coluna ausente: #{table}.#{column}" unless connection.column_exists?(table, column)
  end
end

required_indexes.each do |table, indexes|
  next unless connection.data_source_exists?(table)

  indexes.each do |index_definition|
    index_exists = if index_definition[:name]
                     connection.index_exists?(table, index_definition[:columns], name: index_definition[:name])
                   else
                     connection.index_exists?(table, index_definition[:columns])
                   end
    next if index_exists

    description = index_definition[:name] || index_definition[:columns].join('_')
    errors << "índice ausente: #{table}.#{description}"
  end
end

required_foreign_keys.each do |table, foreign_keys|
  next unless connection.data_source_exists?(table)

  actual_foreign_keys = connection.foreign_keys(table)
  foreign_keys.each do |column, target_table|
    exists = actual_foreign_keys.any? do |foreign_key|
      foreign_key.options[:column].to_s == column.to_s && foreign_key.to_table.to_s == target_table.to_s
    end
    errors << "chave estrangeira ausente: #{table}.#{column} -> #{target_table}" unless exists
  end
end

applied_migrations = connection.select_values('SELECT version FROM schema_migrations')
required_migrations.each do |version|
  errors << "migration não aplicada: #{version}" unless applied_migrations.include?(version)
end

if errors.empty?
  schema_version = applied_migrations.max || 'unknown'
  puts "Schema contract OK (schema_version=#{schema_version})"
else
  warn 'Schema contract FAILED:'
  errors.each { |error| warn "- #{error}" }
  exit 1
end