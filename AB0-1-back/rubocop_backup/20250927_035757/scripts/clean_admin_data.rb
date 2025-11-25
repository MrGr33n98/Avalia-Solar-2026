# Script to clean all ActiveAdmin data
require_relative '../config/environment'

puts 'Starting to clean ActiveAdmin data...'

# Clean Products first to avoid foreign key constraints
puts 'Cleaning Products...'
Product.destroy_all
puts 'All Products have been removed.'

# Clean Categories
puts 'Cleaning Categories...'
Category.destroy_all
puts 'All Categories have been removed.'

# Clean Companies
puts 'Cleaning Companies...'
Company.destroy_all
puts 'All Companies have been removed.'

# Clean ActiveStorage attachments
puts 'Cleaning ActiveStorage attachments...'
ActiveStorage::Attachment.all.each(&:purge)
puts 'All ActiveStorage attachments have been removed.'

puts 'Finished cleaning ActiveAdmin data!'
