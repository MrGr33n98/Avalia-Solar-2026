return unless Rails.env.development? || Rails.env.test?

permissions = %w[read create update delete].flat_map do |action|
  %w[account contact opportunity quote].map { |resource| { resource: resource, action: action } }
end
permissions.each { |attrs| Sales::Permission.find_or_create_by!(attrs) }
Sales::Role.find_or_create_by!(slug: 'sales-manager') do |role|
  role.name = 'Sales Manager'
  role.system = true
end
