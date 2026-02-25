user = User.find_or_initialize_by(email: 'weg.employee.manual@weg.net')
user.assign_attributes(
  name: 'Funcionario WEG Manual',
  password: 'Password123!',
  password_confirmation: 'Password123!',
  role: 'company', # Updated role
  city: 'Jaraguá do Sul',
  state: 'SC',
  terms_accepted: true,
  terms_accepted_at: Time.current,
  status: :active,
  confirmed_at: Time.current
)

if user.save
  puts 'User created/updated successfully!'
  puts "Email: #{user.email}"
  puts 'Password: Password123!'
else
  puts "Error creating user: #{user.errors.full_messages.join(', ')}"
  exit
end

company = Company.find_or_initialize_by(cnpj: '84.429.695/0001-11')
company.assign_attributes(
  name: 'WEG Solar Manual',
  description: 'Empresa líder global em equipamentos eletroeletrônicos.',
  status: :active,
  email_public: 'contato.manual@weg.net',
  email: 'weg.employee.manual@weg.net',
  phone: '4732764000',
  address: 'Av. Prefeito Waldemar Grubba, 3300',
  city: 'Jaraguá do Sul',
  state: 'SC',
  category_ids: [3]
)

if company.save
  puts 'Company created successfully!'

  if company.members.include?(user)
    puts 'User is already a member.'
  else
    CompanyMember.create!(company: company, user: user, role: :owner)
    user.update(company: company) # Ensure direct association if needed by User model logic
    puts 'User associated with company!'
  end
else
  puts "Error creating company: #{company.errors.full_messages.join(', ')}"
end
