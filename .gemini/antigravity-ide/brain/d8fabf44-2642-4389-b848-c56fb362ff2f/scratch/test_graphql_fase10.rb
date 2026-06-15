# frozen_string_literal: true

require_relative '../../../../../../../../../../Users/Bobi/Desktop/AB0-1-main/AB0-1-back/config/environment'

puts "========================================"
puts "TESTING GRAPHQL FASE 10 SCHEMAS"
puts "========================================"

# Test 1: Active States
puts "\n--- Test 1: Active States ---"
query_states = <<-GRAPHQL
  query {
    activeStates
  }
GRAPHQL

result = AvaliaSolarSchema.execute(query_states)
if result['errors']
  puts "Errors in activeStates:"
  puts JSON.pretty_generate(result['errors'])
else
  puts "Success! Output:"
  puts JSON.pretty_generate(result['data'])
end

# Test 2: Active Cities
puts "\n--- Test 2: Active Cities (SP) ---"
query_cities = <<-GRAPHQL
  query {
    activeCities(state: "SP")
  }
GRAPHQL

result = AvaliaSolarSchema.execute(query_cities)
if result['errors']
  puts "Errors in activeCities:"
  puts JSON.pretty_generate(result['errors'])
else
  puts "Success! Output: #{result['data']['activeCities'].size} cities found. First 5:"
  puts JSON.pretty_generate(result['data']['activeCities'].take(5))
end

# Test 3: Active Locations (Pairs)
puts "\n--- Test 3: Active Locations (Pairs) ---"
query_locations = <<-GRAPHQL
  query {
    activeLocations {
      city
      state
    }
  }
GRAPHQL

result = AvaliaSolarSchema.execute(query_locations)
if result['errors']
  puts "Errors in activeLocations:"
  puts JSON.pretty_generate(result['errors'])
else
  puts "Success! Output: #{result['data']['activeLocations'].size} location pairs found."
  puts JSON.pretty_generate(result['data']['activeLocations'].take(5))
end

# Test 4: Category Tree (Recursive)
puts "\n--- Test 4: Category Tree ---"
query_tree = <<-GRAPHQL
  query {
    categoryTree {
      id
      name
      slug
      children {
        id
        name
        slug
      }
    }
  }
GRAPHQL

result = AvaliaSolarSchema.execute(query_tree)
if result['errors']
  puts "Errors in categoryTree:"
  puts JSON.pretty_generate(result['errors'])
else
  puts "Success! Output: #{result['data']['categoryTree'].size} root categories found."
  puts JSON.pretty_generate(result['data']['categoryTree'].take(3))
end

# Test 5: Banners List
puts "\n--- Test 5: Banners ---"
query_banners = <<-GRAPHQL
  query {
    banners(limit: 5) {
      id
      title
      position
      sponsored
      imageUrl
      linkUrl
    }
  }
GRAPHQL

result = AvaliaSolarSchema.execute(query_banners)
if result['errors']
  puts "Errors in banners query:"
  puts JSON.pretty_generate(result['errors'])
else
  puts "Success! Output: #{result['data']['banners'].size} banners found."
  puts JSON.pretty_generate(result['data'])
end

puts "\n========================================"
puts "VALIDATION FINISHED"
puts "========================================"
