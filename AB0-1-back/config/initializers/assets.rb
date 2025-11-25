# Be sure to restart your server when you modify this file
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
Rails.application.config.assets.paths << Rails.root.join('storage')

# Precompile additional assets
Rails.application.config.assets.precompile += %w( 
  *.js *.css *.png *.jpg *.jpeg *.gif *.svg *.ico
  active_storage/*
  active_storage/blobs/*
  active_storage/representations/*
)
