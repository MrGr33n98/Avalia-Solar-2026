#!/bin/bash
# Create a backup directory
mkdir -p /Users/felipemorais/AB0-1/backup_before_cleanup

# Backup files before modifying them
cp -r /Users/felipemorais/AB0-1/AB0-1-back/app/admin /Users/felipemorais/AB0-1/backup_before_cleanup/
cp -r /Users/felipemorais/AB0-1/AB0-1-back/app/controllers /Users/felipemorais/AB0-1/backup_before_cleanup/
cp -r /Users/felipemorais/AB0-1/AB0-1-back/app/models /Users/felipemorais/AB0-1/backup_before_cleanup/
cp -r /Users/felipemorais/AB0-1/AB0-1-back/app/views /Users/felipemorais/AB0-1/backup_before_cleanup/
cp -r /Users/felipemorais/AB0-1/AB0-1-back/app/notifiers /Users/felipemorais/AB0-1/backup_before_cleanup/
cp -r /Users/felipemorais/AB0-1/AB0-1-back/app/helpers /Users/felipemorais/AB0-1/backup_before_cleanup/
cp /Users/felipemorais/AB0-1/AB0-1-back/db/seeds.rb /Users/felipemorais/AB0-1/backup_before_cleanup/
cp /Users/felipemorais/AB0-1/AB0-1-back/db/schema.rb /Users/felipemorais/AB0-1/backup_before_cleanup/
cp /Users/felipemorais/AB0-1/AB0-1-back/config/routes.rb /Users/felipemorais/AB0-1/backup_before_cleanup/

# Remove files related to comments, posts, and users
rm -f /Users/felipemorais/AB0-1/AB0-1-back/app/admin/comments.rb
rm -f /Users/felipemorais/AB0-1/AB0-1-back/app/admin/posts.rb
rm -f /Users/felipemorais/AB0-1/AB0-1-back/app/admin/users.rb

rm -f /Users/felipemorais/AB0-1/AB0-1-back/app/controllers/comments_controller.rb
rm -f /Users/felipemorais/AB0-1/AB0-1-back/app/controllers/posts_controller.rb
rm -f /Users/felipemorais/AB0-1/AB0-1-back/app/controllers/users_controller.rb

rm -f /Users/felipemorais/AB0-1/AB0-1-back/app/models/comment.rb
rm -f /Users/felipemorais/AB0-1/AB0-1-back/app/models/post.rb

rm -rf /Users/felipemorais/AB0-1/AB0-1-back/app/views/comments
rm -rf /Users/felipemorais/AB0-1/AB0-1-back/app/views/posts
rm -rf /Users/felipemorais/AB0-1/AB0-1-back/app/views/users

# Clean up routes.rb
sed -i "" "/resources :comments/d" /Users/felipemorais/AB0-1/AB0-1-back/config/routes.rb
sed -i "" "/resources :posts/d" /Users/felipemorais/AB0-1/AB0-1-back/config/routes.rb
sed -i "" "/resources :users/d" /Users/felipemorais/AB0-1/AB0-1-back/config/routes.rb

# Clean up seeds.rb - remove sections related to comments, posts, and users
sed -i "" "/Comment.create/d" /Users/felipemorais/AB0-1/AB0-1-back/db/seeds.rb
sed -i "" "/Post.create/d" /Users/felipemorais/AB0-1/AB0-1-back/db/seeds.rb
sed -i "" "/User.create/d" /Users/felipemorais/AB0-1/AB0-1-back/db/seeds.rb

echo "Cleanup completed. Backups stored in /Users/felipemorais/AB0-1/backup_before_cleanup/"
