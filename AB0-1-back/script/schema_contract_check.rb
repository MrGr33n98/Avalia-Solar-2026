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

required_groups_schema = {
  groups: %i[name slug description short_description visibility membership_mode posting_mode status owner_id
             category_id official verified featured members_count posts_count],
  group_memberships: %i[group_id user_id role status joined_at approved_at approved_by_id notifications_level muted_until]
}.freeze

required_groups_indexes = {
  groups: [
    { columns: [:slug], unique: true },
    { columns: [:status] },
    { columns: [:visibility] },
    { columns: [:featured] },
    { columns: %i[status visibility] }
  ],
  group_memberships: [
    { columns: %i[group_id user_id] },
    { columns: %i[group_id status] },
    { columns: %i[group_id role] }
  ]
}.freeze

required_groups_migrations = %w[20260824200000 20260824200100].freeze

required_groups_foreign_keys = {
  groups: { owner_id: :users, category_id: :categories },
  group_memberships: { group_id: :groups, user_id: :users, approved_by_id: :users }
}.freeze

required_groups_checks = {
  groups: %w[groups_visibility_check groups_membership_mode_check groups_posting_mode_check groups_status_check],
  group_memberships: %w[group_memberships_role_check group_memberships_status_check group_memberships_notifications_level_check]
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

required_groups_schema.each do |table, columns|
  unless connection.data_source_exists?(table)
    errors << "tabela ausente: #{table}"
    next
  end

  columns.each do |column|
    errors << "coluna ausente: #{table}.#{column}" unless connection.column_exists?(table, column)
  end
end

required_groups_indexes.each do |table, indexes|
  next unless connection.data_source_exists?(table)

  indexes.each do |index_definition|
    index_exists = connection.index_exists?(
      table,
      index_definition[:columns],
      unique: index_definition.fetch(:unique, false)
    )
    errors << "índice ausente: #{table}.#{index_definition[:columns].join('_')}" unless index_exists
  end
end

required_groups_foreign_keys.each do |table, foreign_keys|
  next unless connection.data_source_exists?(table)

  actual_foreign_keys = connection.foreign_keys(table)
  foreign_keys.each do |column, target_table|
    exists = actual_foreign_keys.any? do |foreign_key|
      foreign_key.options[:column].to_s == column.to_s && foreign_key.to_table.to_s == target_table.to_s
    end
    errors << "chave estrangeira ausente: #{table}.#{column} -> #{target_table}" unless exists
  end
end

required_groups_checks.each do |table, constraint_names|
  next unless connection.data_source_exists?(table)

  check_constraints = connection.check_constraints(table).map(&:name)
  constraint_names.each do |constraint_name|
    errors << "constraint ausente: #{table}.#{constraint_name}" unless check_constraints.include?(constraint_name)
  end
end

applied_migrations = connection.select_values('SELECT version FROM schema_migrations')
required_migrations.each do |version|
  errors << "migration não aplicada: #{version}" unless applied_migrations.include?(version)
end

required_groups_migrations.each do |version|
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