FactoryBot.define do
  factory :company_project do
    association :company
    sequence(:title) { |n| "Projeto solar #{n}" }
    sequence(:slug) { |n| "projeto-solar-#{n}" }
    status { 'draft' }
    capacity_unit { 'kWp' }
  end

  factory :content_lead_form do
    association :company
    sequence(:name) { |n| "Formulário de material #{n}" }
    status { 'active' }
    fields { [{ 'key' => 'name', 'label' => 'Nome', 'type' => 'text', 'required' => true }, { 'key' => 'email', 'label' => 'E-mail', 'type' => 'email', 'required' => true }] }
  end

  factory :company_material do
    association :company
    sequence(:title) { |n| "Catálogo #{n}" }
    sequence(:slug) { |n| "catalogo-#{n}" }
    material_type { 'catalog' }
    gate_mode { 'none' }
    status { 'draft' }
  end

  factory :digital_asset do
    association :attachable, factory: :company_project
    kind { 'video' }
    external_url { 'https://www.youtube.com/watch?v=example123' }
    provider { 'youtube' }
    status { 'pending' }
    processing_status { 'pending' }

    after(:build) { |asset| asset.company = asset.attachable.company }
  end

  factory :content_lead do
    association :company
    sequence(:email) { |n| "content-lead-#{n}@example.com" }
    name { 'Lead de conteúdo' }
  end
end
