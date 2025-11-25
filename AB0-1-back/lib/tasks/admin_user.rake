namespace :admin do
  desc "Create an admin user"
  task :create_user, [:email, :password] => :environment do |task, args|
    email = args[:email] || ENV['EMAIL'] || 'admin@example.com'
    password = args[:password] || ENV['PASSWORD'] || 'password123'
    
    admin_user = AdminUser.find_or_create_by(email: email) do |user|
      user.password = password
      user.password_confirmation = password
    end
    
    if admin_user.persisted?
      puts "Admin user #{email} is ready!"
    else
      puts "Error creating admin user: #{admin_user.errors.full_messages.join(', ')}"
    end
  end
end