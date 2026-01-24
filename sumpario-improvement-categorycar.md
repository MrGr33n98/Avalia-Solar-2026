# AnÃ¡lise de Melhoria: Funcionalidade de Categorias
**Data:** 23/01/2026 22:54
**Objetivo:** Consolidar arquitetura, fluxo de dados e oportunidades de melhoria para a aba /categories.

---

## 1. Resumo da Funcionalidade
A aba "Categories" gerencia a hierarquia de classificaÃ§Ã£o de empresas e produtos. Ela permite a navegaÃ§Ã£o por nichos (ex: AlimentaÃ§Ã£o, Tecnologia), exibindo mÃ©tricas consolidadas (contagem de empresas, produtos e avaliaÃ§Ãµes mÃ©dias) e facilitando o SEO atravÃ©s de URLs amigÃ¡veis.

## 2. Arquitetura e Fluxo de Dados
- **Frontend:** Utiliza Next.js com componentes de servidor para busca inicial (SEO) e componentes de cliente para interatividade (filtros/cards).
- **Backend:** API em Ruby on Rails utilizando ActiveRecord para gerenciar a Ã¡rvore de categorias (parent/child) e gatilhos (callbacks) para sincronizaÃ§Ã£o de mÃ©tricas de desempenho.
- **Fluxo:** 
  1. O usuÃ¡rio acessa /categories.
  2. O Frontend solicita dados ao endpoint pi/v1/categories.
  3. O Backend resolve o cache e retorna o JSON estruturado.
  4. O CategoryCard renderiza as mÃ©tricas e links de SEO.

---

## 3. Arquivos Analisados e Responsabilidades

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\app\helpers\api\v1\categorys_helper.rb
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de suporte Ã  funcionalidade de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\app\helpers\api\v1\categorys_helper.rb.Extension).Replace(".", ""))
module Api::V1::CategorysHelper
end

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\app\models\category.rb
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de persistÃªncia e regras de negÃ³cio de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\app\models\category.rb.Extension).Replace(".", ""))
class Category < ApplicationRecord
  include QueryCacheable # TASK-016: Query Caching
  
  # =========================
  # Associations
  # =========================
  belongs_to :parent, class_name: 'Category', optional: true
  has_many :children, class_name: 'Category', foreign_key: :parent_id, dependent: :nullify
  has_many :badges, dependent: :destroy
  accepts_nested_attributes_for :badges, allow_destroy: true
  
  has_and_belongs_to_many :companies, join_table: :categories_companies,
                          after_add: :update_metrics_on_change,
                          after_remove: :update_metrics_on_change

  has_and_belongs_to_many :products, join_table: :categories_products,
                          after_add: :update_metrics_on_change,
                          after_remove: :update_metrics_on_change
  has_many :articles
  has_one_attached :banner
  has_one_attached :icon
  has_and_belongs_to_many :banners, join_table: :banners_categories

  # =========================
  # Validations
  # =========================
  validates :name, presence: true, uniqueness: true
  validates :description, presence: true
  validate :validate_banner_technical_requirements

  # =========================
  # Scopes
  # =========================
  scope :roots,     -> { where(parent_id: nil) }
  scope :featured,  -> { where(featured: true) }
  scope :active,    -> { where(status: 'active') }
  scope :by_region, ->(state) { joins(:companies).where(companies: { state: state }).distinct }
  scope :by_min_rating, ->(rating) { where("average_rating >= ?", rating) }
  scope :by_max_price, ->(price) { where("average_price <= ?", price) }
  scope :containing_products_by_price, ->(price) { joins(:products).where("products.price <= ?", price).distinct }

  # =========================
  # Cacheable Queries - TASK-016
  # =========================
  cacheable_query :featured, expires_in: 1.hour do
    where(featured: true)
      .includes(:products, :companies)
      .order(name: :asc)
  end

  cacheable_query :active, expires_in: 1.hour do
    where(status: 'active')
      .order(name: :asc)
  end

  # =========================
  # Ransack configuration
  # =========================
  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id name description created_at updated_at
      featured status kind seo_url seo_title short_description
      companies_count products_count average_rating average_price views_count
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[companies products banner_attachment banner_blob]
  end

  # =========================
  # Instance Methods
  # =========================
  
  def tags
    t = []
    t << 'Destaque' if featured?
    t << 'Mais procurado' if (companies_count || 0) > 10
    t << 'Novidade' if created_at && created_at > 30.days.ago
    t
  end

  def banner_url
    return nil unless banner.attached?
    begin
      options = Rails.application.routes.default_url_options.dup
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
      Rails.application.routes.url_helpers.rails_blob_url(banner, options)
    rescue => e
      Rails.logger.error("Error generating category banner URL: #{e.message}")
      nil
    end
  end

  def icon_url
    return nil unless icon.attached?
    begin
      options = Rails.application.routes.default_url_options.dup
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
      Rails.application.routes.url_helpers.rails_blob_url(icon, options)
    rescue => e
      Rails.logger.error("Error generating category icon URL: #{e.message}")
      nil
    end
  end

  def total_reviews_count
    companies.joins(:reviews).count
  end

  def update_metrics!
    active_companies = companies.where(status: 'active').count
    active_products = products.where(status: 'active')
    
    update_columns(
      companies_count: active_companies,
      products_count: active_products.count,
      average_rating: companies.joins(:reviews).average('reviews.rating') || 0.0,
      average_price: active_products.average(:price) || 0.0
    )
  end

  private

  def update_metrics_on_change(_record)
    update_metrics!
  end

  def validate_banner_technical_requirements
    return unless banner.attached?
    
    blob = if attachment_changes['banner']
             attachment_changes['banner'].attachment.blob
           else
             banner.blob
           end

    return unless blob

    unless blob.content_type.in?(%w[image/png image/jpeg image/jpg])
      errors.add(:banner, 'deve ser PNG ou JPG')
    end

    if blob.byte_size > 500.kilobytes
      errors.add(:banner, 'deve ter no mÃ¡ximo 500KB')
    end
  end
end

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\app\serializers\category_serializer.rb
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de suporte Ã  funcionalidade de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\app\serializers\category_serializer.rb.Extension).Replace(".", ""))
class CategorySerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :name, :seo_url, :seo_title,
             :short_description, :description,
             :parent_id, :kind, :status, :featured,
             :created_at, :updated_at, :banner_url, :icon_url
             # :banner_sponsored, :banners  # Temporarily commented out

  has_many :companies
  has_many :products
  # has_many :banners, serializer: BannerSerializer  # Commented out - BannerSerializer not found

  def banner_url
    return unless object.banner.attached?

    Rails.application.routes.url_helpers.rails_blob_url(object.banner, only_path: false)
  end

  def icon_url
    return unless object.icon.attached?

    Rails.application.routes.url_helpers.rails_blob_url(object.icon, only_path: false)
  end

  # Temporarily commented out to fix the search issue
  # def banners
  #   object.banners.map do |banner|
  #     {
  #       id: banner.id,
  #       title: banner.title,
  #       image_url: banner.image.attached? ? rails_blob_url(banner.image, only_path: false) : nil,
  #       link: banner.link,
  #       banner_type: banner.banner_type,
  #       position: banner.position,
  #       active: banner.active,
  #       sponsored: banner.sponsored
  #     }
  #   end
  # end
end

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\db\migrate\20250923133246_add_category_id_and_sponsored_to_banners.rb
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de suporte Ã  funcionalidade de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\db\migrate\20250923133246_add_category_id_and_sponsored_to_banners.rb.Extension).Replace(".", ""))
class AddCategoryIdAndSponsoredToBanners < ActiveRecord::Migration[7.0]
  def change
    return unless table_exists?(:banners)
    if table_exists?(:categories)
      unless column_exists?(:banners, :category_id)
        add_reference :banners, :category, null: true, foreign_key: true
      end
    end
    unless column_exists?(:banners, :sponsored)
      add_column :banners, :sponsored, :boolean, default: false
    end
  end
end

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\db\seeds_category_banners.rb
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de suporte Ã  funcionalidade de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\db\seeds_category_banners.rb.Extension).Replace(".", ""))
# Seeds for Category Banners
# Run with: rails runner db/seeds_category_banners.rb

require 'open-uri'

puts "ðŸŽ¨ Setting up category banners..."

# Banner images (you can replace these URLs with your own images)
banner_images = {
  'Inversores Solares' => 'https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
  'Baterias de Armazenamento' => 'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
  'Sistemas Off-Grid' => 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
  'PainÃ©is Solares' => 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
  'BSol Energia Solar' => 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80'
}

banner_images.each do |category_name, image_url|
  category = Category.find_by(name: category_name)
  
  if category
    puts "ðŸ“¸ Adding banner to #{category_name}..."
    
    begin
      # Download image
      file = URI.open(image_url)
      
      # Attach banner
      category.banner.attach(
        io: file,
        filename: "#{category.seo_url}-banner.jpg",
        content_type: 'image/jpeg'
      )
      
      puts "âœ… Banner added successfully to #{category_name}"
    rescue => e
      puts "âŒ Error adding banner to #{category_name}: #{e.message}"
    end
  else
    puts "âš ï¸  Category '#{category_name}' not found"
  end
end

puts "ðŸŽ‰ Category banner setup complete!"
puts "\nTo run this seeder:"
puts "cd /Users/felipemorais/AB0-1/AB0-1-back"
puts "rails runner db/seeds_category_banners.rb"

puts "\nTo view categories with banners:"
puts "- Admin: http://localhost:3001/admin/categories"
puts "- API: http://localhost:3001/api/v1/categories"
puts "- Frontend: http://localhost:3000/categories/inversores-solares"
`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\spec\requests\api\v1\banners_category_targeting_spec.rb
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de suporte Ã  funcionalidade de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\spec\requests\api\v1\banners_category_targeting_spec.rb.Extension).Replace(".", ""))
require 'rails_helper'

RSpec.describe 'Banners category targeting', type: :request do
  let!(:category_a) { create(:category) }
  let!(:category_b) { create(:category) }

  let!(:global_banner) { create(:banner, position: 'categories_top') }

  let!(:banner_a) do
    create(:banner, position: 'categories_top').tap do |banner|
      banner.categories << category_a
      banner.save!
    end
  end

  let!(:banner_b) do
    create(:banner, position: 'categories_top').tap do |banner|
      banner.categories << category_b
      banner.save!
    end
  end

  describe 'GET /api/v1/categories/:id/banners' do
    it 'returns global + targeted banners for the category' do
      get "/api/v1/categories/#{category_a.id}/banners"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      ids = body.map { |b| b['id'] }

      expect(ids).to include(global_banner.id, banner_a.id)
      expect(ids).not_to include(banner_b.id)

      payload = body.find { |b| b['id'] == banner_a.id }
      expect(payload['width']).to be_present
      expect(payload['height']).to be_present
      expect(payload['category_ids']).to include(category_a.id)
    end
  end

  describe 'GET /api/v1/banners' do
    it 'filters by category_id and keeps global banners' do
      get '/api/v1/banners', params: { position: 'categories_top', category_id: category_b.id }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      ids = body.map { |b| b['id'] }

      expect(ids).to include(global_banner.id, banner_b.id)
      expect(ids).not_to include(banner_a.id)
    end
  end
end


`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\test\controllers\api\v1\categorys_controller_test.rb
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de exposiÃ§Ã£o da API e controle de fluxo de requisiÃ§Ãµes.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\test\controllers\api\v1\categorys_controller_test.rb.Extension).Replace(".", ""))
require 'test_helper'

class Api::V1::CategorysControllerTest < ActionDispatch::IntegrationTest
  setup do
    @category = Category.create!(
      name: 'PainÃ©is Solares',
      seo_url: 'paineis-solares',
      seo_title: 'PainÃ©is Solares',
      status: 'active',
      kind: 'product'
    )
    
    @company = Company.create!(
      name: 'Test Company',
      description: 'Test Description',
      status: 'active',
      verified: true
    )
    @category.companies << @company
  end

  test "should get index with companies" do
    get api_v1_categories_url
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_not_nil json_response
    assert_kind_of Array, json_response
  end

  test "should get category companies by id" do
    get companies_api_v1_category_url(@category)
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_kind_of Array, json_response
    assert_equal 1, json_response.length
    
    company = json_response.first
    assert_includes company.keys, 'banner_url'
    assert_includes company.keys, 'logo_url'
  end

  test "should get category companies with image fields" do
    get companies_api_v1_category_url(@category)
    assert_response :success
    
    json_response = JSON.parse(response.body)
    company_data = json_response.first
    
    # Verify image fields exist even if null
    assert company_data.key?('banner_url')
    assert company_data.key?('logo_url')
  end
end

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\test\models\category_test.rb
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de persistÃªncia e regras de negÃ³cio de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\test\models\category_test.rb.Extension).Replace(".", ""))
require 'test_helper'

class CategoryTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\app\categories\[slug]\__tests__\category-client-banners.test.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de pÃ¡gina principal de listagem no frontend.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\app\categories\[slug]\__tests__\category-client-banners.test.tsx.Extension).Replace(".", ""))
require 'test_helper'

class CategoryTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\app\categories\[slug]\CategoryClientComponent.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de pÃ¡gina principal de listagem no frontend.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\app\categories\[slug]\CategoryClientComponent.tsx.Extension).Replace(".", ""))
require 'test_helper'

class CategoryTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\app\categories\[slug]\CategoryPageServer.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de pÃ¡gina principal de listagem no frontend.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\app\categories\[slug]\CategoryPageServer.tsx.Extension).Replace(".", ""))
require 'test_helper'

class CategoryTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\app\categories\CategoryContext.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de pÃ¡gina principal de listagem no frontend.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\app\categories\CategoryContext.tsx.Extension).Replace(".", ""))
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Category } from '@/lib/api';

interface CategoryContextType {
  category: Category | null;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children, category }: { children: ReactNode; category: Category | null }) {
  return (
    <CategoryContext.Provider value={{ category }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
}
`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\app\models\category.rb
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de persistÃªncia e regras de negÃ³cio de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\app\models\category.rb.Extension).Replace(".", ""))
class Category < ApplicationRecord
  has_one_attached :banner
  has_and_belongs_to_many :companies
  
  def banner_url
    if banner.attached?
      # Make sure to use the full URL with host for external access
      Rails.application.routes.url_helpers.rails_blob_url(
        banner, 
        host: Rails.application.config.action_mailer.default_url_options[:host]
      )
    end
  end
  
  def as_json(options = {})
    super(options.merge(
      methods: [:banner_url]
    ))
  end
end
`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\admin\CategoryImporter.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\admin\CategoryImporter.tsx.Extension).Replace(".", ""))
'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';

export default function CategoryImporter() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success?: string;
    errors?: string[];
  } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setResult({ errors: ['Please upload a CSV file'] });
      return;
    }

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use the adminApi for importing categories
      const data: any = await adminApi.importCategories(formData);

      setResult({
        success: data.message,
        errors: data.errors
      });
    } catch (error) {
      setResult({
        errors: [error instanceof Error ? error.message : 'Failed to upload file']
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Import Categories</h3>
      
      <div className="space-y-4">
        <label className="block">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              'Uploading...'
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select CSV File
              </>
            )}
          </Button>
        </label>

        {result?.success && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{result.success}</span>
          </div>
        )}

        {result?.errors && result.errors.length > 0 && (
          <div className="bg-red-50 p-3 rounded">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>There were errors during import:</span>
            </div>
            <ul className="list-disc pl-5 text-sm text-red-600">
              {result.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium mb-2">CSV Format:</h4>
        <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
          name,seo_url,seo_title,short_description,description,parent_id,kind,status,featured{'\n'}
          Solar Panels,solar-panels,Solar Panels | Avalia Solar,High efficiency panels,Detailed description,,product,active,true
        </pre>
      </div>
    </div>
  );
}


`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\blog\CategoryFilter.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\blog\CategoryFilter.tsx.Extension).Replace(".", ""))
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';
import { Loader2, Filter } from 'lucide-react';
import { BlogPromoBanner } from './BlogPromoBanner';

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categoriesData, isLoading } = useCategoriesQuery();
  const categories = categoriesData?.data || [];
  
  const selectedCategoryIds = React.useMemo(() => {
    const catParam = searchParams.get('category');
    if (!catParam) return [];
    return catParam.split(',').map(id => Number(id));
  }, [searchParams]);

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    const current = new Set(selectedCategoryIds);
    if (checked) {
      current.add(categoryId);
    } else {
      current.delete(categoryId);
    }

    const params = new URLSearchParams(searchParams.toString());
    if (current.size > 0) {
      params.set('category', Array.from(current).join(','));
    } else {
      params.delete('category');
    }
    
    // Reset page when filtering
    params.delete('page');
    
    router.push(`/blog?${params.toString()}`);
  };

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardHeader className="pb-3 border-b border-slate-100 mb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          Filtrar por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-6 pb-2">
          <BlogPromoBanner
            type="informative"
            title="Dica"
            message="Use os filtros para encontrar o que precisa."
            className="mb-2"
          />
        </div>
        <ScrollArea className="h-[300px] px-6 pb-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`category-${category.id}`} 
                      checked={selectedCategoryIds.includes(category.id)}
                      onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-600"
                    >
                      {category.name}
                    </Label>
                  </div>
                  {/* Mock count or real count if available */}
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200">
                    {Math.floor(Math.random() * 50) + 1}
                  </Badge>
                </div>
              ))}
              
              {categories.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nenhuma categoria encontrada.
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\blog\CategoryHighlights.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\blog\CategoryHighlights.tsx.Extension).Replace(".", ""))
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Sun, Wrench, Banknote } from 'lucide-react';

const HIGHLIGHTS = [
  {
    id: 'economy',
    title: 'Economia',
    icon: Wallet,
    color: 'text-green-500',
    bg: 'bg-green-50',
    href: '/blog?category=1' // Adjust ID based on real data if needed
  },
  {
    id: 'installation',
    title: 'InstalaÃ§Ã£o',
    icon: Sun,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    href: '/blog?category=2'
  },
  {
    id: 'maintenance',
    title: 'ManutenÃ§Ã£o',
    icon: Wrench,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    href: '/blog?category=3'
  },
  {
    id: 'financing',
    title: 'Financiamento',
    icon: Banknote,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    href: '/blog?category=4'
  }
];

export function CategoryHighlights() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 my-12">
      {HIGHLIGHTS.map((item) => (
        <Link key={item.id} href={item.href} className="group">
          <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group-hover:-translate-y-1">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <span className="font-bold text-slate-700 group-hover:text-primary transition-colors text-lg">
                {item.title}
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\landing\LandingCategoryCard.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\landing\LandingCategoryCard.tsx.Extension).Replace(".", ""))
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building2, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Category } from '@/lib/api';
import { buildCategoryPath } from '@/lib/slug';
import { cn } from '@/lib/utils';

type LandingCategoryCardProps = {
  category: Category;
  className?: string;
};

function resolveCategoryImage(category: Category): string {
  const banner = category?.banner_url;
  const logo = category?.logo?.url;
  return banner || logo || '/images/category-placeholder.jpg';
}

export default function LandingCategoryCard({ category, className }: LandingCategoryCardProps) {
  const href = buildCategoryPath(category?.seo_url, category?.id);
  const companiesCount = category?.companies_count ?? category?.companies?.length ?? 0;
  const reviewsCount = (category as any)?.reviews_count ?? 0;
  const avgRating = (category as any)?.average_rating ?? (category as any)?.rating ?? null;
  const ratingLabel = typeof avgRating === 'number' ? avgRating.toFixed(1) : null;

  return (
    <Card className={cn('overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow', className)}>
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl">
        <div className="relative aspect-[3/2] bg-gray-100">
          <Image
            src={resolveCategoryImage(category)}
            alt={category?.name || 'Categoria'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center"
          />
        </div>

        <div className="p-4">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 leading-tight line-clamp-2">
            {category?.name || 'Categoria'}
          </h3>

          <p className="mt-1 text-sm text-slate-600 line-clamp-2">
            {category?.short_description || 'Empresas verificadas e confiÃ¡veis'}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              {companiesCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  {companiesCount}
                </span>
              ) : null}

              {reviewsCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  {ratingLabel ? <span className="font-medium">{ratingLabel}</span> : null}
                  <span className="text-slate-400">{ratingLabel ? `(${reviewsCount})` : reviewsCount}</span>
                </span>
              ) : null}
            </div>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <span>
                Explorar <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  );
}

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\landing\LandingCategoryChips.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\landing\LandingCategoryChips.tsx.Extension).Replace(".", ""))
'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  BatteryCharging,
  ChevronRight,
  Cpu,
  LayoutGrid,
  LayoutPanelTop,
  PlugZap,
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Category } from '@/lib/api';
import { buildCategoryPath } from '@/lib/slug';
import { cn } from '@/lib/utils';

type LandingCategoryChipsProps = {
  categories: Category[];
  className?: string;
  includeAllChip?: boolean;
  limit?: number;
};

function getIconForCategory(category: Category) {
  const name = (category?.name || '').toLowerCase();
  const slug = (category?.seo_url || '').toLowerCase();
  const key = `${name} ${slug}`;

  if (key.includes('pain') || key.includes('panel')) return LayoutPanelTop;
  if (key.includes('invers') || key.includes('converter')) return Cpu;
  if (key.includes('bater') || key.includes('battery')) return BatteryCharging;
  if (key.includes('instal') || key.includes('install')) return Wrench;
  if (key.includes('off') || key.includes('grid')) return PlugZap;
  return LayoutGrid;
}

export default function LandingCategoryChips({
  categories,
  className,
  includeAllChip = true,
  limit = 10,
}: LandingCategoryChipsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const safe = Array.isArray(categories) ? categories : [];
    return safe.slice(0, Math.max(0, limit));
  }, [categories, limit]);

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className={cn('px-4 md:px-6', className)}>
      <div className="container mx-auto">
        <div className="relative rounded-2xl bg-white/70 border border-gray-200 shadow-sm">
          <div
            ref={scrollerRef}
            className="flex items-center gap-3 overflow-x-auto px-3 py-3 no-scrollbar"
            role="list"
            aria-label="Categorias em destaque"
          >
            {includeAllChip ? (
              <Link
                href="/categories"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all whitespace-nowrap"
                role="listitem"
              >
                <LayoutGrid className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-900">Categorias</span>
              </Link>
            ) : null}

            {items.map((category) => {
              const href = buildCategoryPath(category?.seo_url, category?.id);
              const Icon = getIconForCategory(category);
              return (
                <Link
                  key={category.id}
                  href={href}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all whitespace-nowrap"
                  role="listitem"
                  aria-label={category.name}
                >
                  <Icon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-900">{category.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 bg-gradient-to-l from-white via-white/70 to-transparent rounded-r-2xl">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => scrollBy(320)}
              className="h-9 w-9 rounded-full border border-gray-200 bg-white/90 shadow-sm hover:bg-white"
              aria-label="Ver mais categorias"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}


`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\__tests__\CategoryCard.test.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\__tests__\CategoryCard.test.tsx.Extension).Replace(".", ""))
import { render, screen } from '@testing-library/react';
import CategoryCard from '@/components/CategoryCard';
import CategoryCardMinimal from '@/components/CategoryCardMinimal';

const baseCategory = {
  id: 1,
  name: 'Recarga em CondomÃ­nios',
  short_description: 'SoluÃ§Ã£o para condomÃ­nios',
  description: 'SoluÃ§Ã£o para condomÃ­nios',
  seo_url: 'recarga-em-condominios',
  banner_url: '/images/banner-avalia-solar.png',
  companies_count: 8,
  products_count: 0,
  status: 'active',
  kind: 'standard',
  parent_id: null,
  logo: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as any;

describe('Category cards mobile image behavior', () => {
  it('CategoryCard usa object-cover no banner', () => {
    render(<CategoryCard category={baseCategory} layout="top" />);
    const img = screen.getByAltText(/Categoria:/i);
    expect(img).toHaveClass('object-cover');
  });

  it('CategoryCardMinimal usa object-cover no banner', () => {
    render(<CategoryCardMinimal category={baseCategory} />);
    const img = screen.getByAltText(baseCategory.name);
    expect(img).toHaveClass('object-cover');
  });
});
`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\CategoryBanner.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\CategoryBanner.tsx.Extension).Replace(".", ""))
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

import { Category } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { Button } from '@/components/ui/button';
import { Building2, Package } from 'lucide-react'; // SugestÃ£o: adicione Ã­cones simples

const MotionDiv = motion.div;

interface CategoryBannerProps {
  category: Category;
  companiesCount?: number;
  productsCount?: number;
  height?: string;
  onQuoteClick?: () => void;
}

export default function CategoryBanner({
  category,
  companiesCount = 0,
  productsCount = 0,
  height = 'h-48 sm:h-56 md:h-64', // Aumentei um pouco a altura para melhor respiro
  onQuoteClick,
}: CategoryBannerProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const bannerUrl = useMemo(() => {
    return (
      getFullImageUrl((category as any)?.banner_url) ||
      getFullImageUrl((category as any)?.image_url) ||
      ''
    );
  }, [(category as any)?.banner_url, (category as any)?.image_url]);

  const hasImage = typeof bannerUrl === 'string' && bannerUrl.trim().length > 0 && !imageError;

  const subtitle = (category as any)?.short_description || (category as any)?.description || '';

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={[
        'relative mx-auto w-full max-w-[1180px] overflow-hidden rounded-3xl',
        'bg-slate-900 shadow-xl', // Fundo escuro para caso a imagem falhe
        height,
      ].join(' ')}
    >
      {/* IMAGEM DE FUNDO COM EFEITO */}
      {hasImage && (
        <Image
          src={bannerUrl}
          alt={`${category.name} Banner`}
          fill
          priority
          className={[
            'object-cover object-center transition-all duration-1000 ease-out',
            imageLoaded ? 'scale-100 opacity-70' : 'scale-110 opacity-0',
          ].join(' ')}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
        />
      )}

      {/* OVERLAY DE GRADIENTE (Essencial para UX) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />

      {/* CONTEÃšDO */}
      <div className="relative z-20 flex h-full flex-col justify-center px-6 sm:px-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
            {category.name}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-gray-100 line-clamp-2 max-w-md font-medium drop-shadow-sm">
              {subtitle}
            </p>
          )}

          {/* BADGES DE STATUS */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-white/90">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <Building2 size={14} className="text-emerald-400" />
              <span>{companiesCount} empresas</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <Package size={14} className="text-emerald-400" />
              <span>{productsCount} produtos</span>
            </div>
          </div>

          {/* BOTÃƒO DE AÃ‡ÃƒO */}
          {onQuoteClick && (
            <div className="mt-6">
              <Button
                onClick={onQuoteClick}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-6 rounded-xl transition-transform active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                Solicitar OrÃ§amento GrÃ¡tis
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </MotionDiv>
  );
}
`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\CategoryCard.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\CategoryCard.tsx.Extension).Replace(".", ""))
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Package, Star, TrendingUp, Users } from 'lucide-react';
import { Category } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { buildCategoryPath } from '@/lib/slug';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';

const MotionDiv = motion.div;

interface CategoryCardProps {
  category: Category;
  className?: string;
  layout?: string;
}

export default function CategoryCard({ category, className = "" }: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayData = {
    id: category?.id,
    name: category?.name || 'Categoria',
    description: category?.short_description || category?.description || '',
    banner_url: getFullImageUrl(category?.banner_url),
    seo_url: buildCategoryPath(category?.seo_url, category?.id),
    companies_count: category?.companies_count ?? 0,
    products_count: category?.products_count ?? 0,
    rating: category?.average_rating && Number(category.average_rating) > 0 
      ? Number(category.average_rating).toFixed(1) 
      : 'Nova',
    featured: category?.featured,
    average_price: category?.average_price && Number(category.average_price) > 0
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(category.average_price))
      : null,
    tags: category?.tags || [],
    badges: category?.badges || []
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("h-full", className)}
    >
      <Link href={displayData.seo_url} className="block h-full group outline-none">
        <Card 
          className="h-full overflow-hidden border-border/40 bg-card hover:bg-accent/5 transition-all duration-300 hover:shadow-xl hover:border-primary/20 group-hover:-translate-y-1 flex flex-col"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image Header */}
          <div className="relative aspect-[3/2] overflow-hidden bg-muted">
             {displayData.banner_url ? (
               <Image
                 src={displayData.banner_url}
                 alt={displayData.name}
                 fill
                 className="object-cover transition-transform duration-700 group-hover:scale-110"
                 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                 <Building2 className="w-12 h-12 text-gray-300" />
               </div>
             )}
             
             {/* Overlay Gradient */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />

             {/* Badge */}
             <div className="absolute top-3 left-3 flex flex-col gap-2">
               {displayData.featured && (
                 <Badge variant="secondary" className="bg-white/90 text-primary hover:bg-white shadow-sm backdrop-blur-sm w-fit">
                   <TrendingUp className="w-3 h-3 mr-1" />
                   Destaque
                 </Badge>
               )}
               {displayData.badges.map((badge, idx) => (
                  <Badge key={idx} variant="outline" className="bg-black/50 text-white border-white/20 backdrop-blur-sm w-fit">
                    {badge.image_url && <Image src={badge.image_url} alt={badge.name} width={12} height={12} className="mr-1" />}
                    {badge.name}
                  </Badge>
               ))}
             </div>
          </div>

          <CardHeader className="pb-2 relative -mt-12 z-10 px-5">
             <div className="bg-background/95 backdrop-blur rounded-xl p-4 shadow-sm border border-border/50">
               <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                 {displayData.name}
               </h3>
               <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-foreground">{displayData.rating}</span>
                  </div>
                  <Separator orientation="vertical" className="h-3" />
                  <span>{displayData.companies_count} empresas</span>
                  {displayData.average_price && (
                    <>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="text-green-600 font-medium">{displayData.average_price}</span>
                    </>
                  )}
               </div>
             </div>
          </CardHeader>

          <CardContent className="px-5 pb-4 pt-2 flex-grow space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {displayData.description}
            </p>
            
            {displayData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {displayData.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                    {tag}
                  </span>
                ))}
                {displayData.tags.length > 3 && (
                  <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                    +{displayData.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="px-5 pb-5 pt-0 mt-auto">
            <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              Explorar Categoria
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </MotionDiv>
  );
}

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\CategoryCardFeatured.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\CategoryCardFeatured.tsx.Extension).Replace(".", ""))
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/lib/api';
import { ArrowUpRight, TrendingUp, Users, Star, Zap, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { buildCategoryPath } from '@/lib/slug';
import { getFullImageUrl } from '@/utils/image';

interface CategoryCardFeaturedProps {
  category: Category;
  className?: string;
}

export default function CategoryCardFeatured({ category, className }: CategoryCardFeaturedProps) {
  const seoUrl = buildCategoryPath(category.seo_url, category.id);
  
  const companiesCount = category.companies_count || 0;
  const productsCount = category.products_count || 0;
  const rating = (category as any).average_rating || 4.5;
  const reviewsCount = (category as any).reviews_count || 0;

  // Image handling
  const iconUrl = (category as any).icon_url;
  const logoUrl = category.logo?.url;
  const bannerUrl = category.banner_url;
  const rawImageUrl = iconUrl || logoUrl || bannerUrl;
  const imageUrl = getFullImageUrl(rawImageUrl);

  return (
    <Link 
      href={seoUrl} 
      className={cn(
        "block group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-blue-200", 
        className
      )}
    >
      {/* Background & Overlay - Updated to Corporate Blue Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 transition-transform duration-500 group-hover:scale-105" />
      
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      
      {/* Image/Icon Background (if available) - Low opacity overlay */}
      {imageUrl && (
        <div className="absolute inset-0 opacity-10 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-20">
          <Image
            src={imageUrl}
            alt={category.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="relative p-5 flex flex-col h-full justify-between text-white">
        
        {/* Header: Tag & Icon */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-blue-100 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
            <TrendingUp className="w-3 h-3" />
            <span>Destaque</span>
          </div>
          <div className="bg-white/20 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
            <ArrowUpRight className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2 leading-tight group-hover:translate-x-1 transition-transform duration-300 drop-shadow-sm">
            {category.name}
          </h3>
          <p className="text-blue-50 text-xs sm:text-sm line-clamp-2 leading-relaxed opacity-90 font-medium">
            {category.short_description || category.description || 'SoluÃ§Ãµes completas em energia solar.'}
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap gap-2 mt-auto">
          {companiesCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-white/90 bg-black/10 px-2 py-1 rounded-md backdrop-blur-sm">
              <Users className="w-3 h-3" />
              <span>{companiesCount}</span>
            </div>
          )}
          {productsCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-white/90 bg-black/10 px-2 py-1 rounded-md backdrop-blur-sm">
              <Package className="w-3 h-3" />
              <span>{productsCount}</span>
            </div>
          )}
          {reviewsCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-white/90 bg-black/10 px-2 py-1 rounded-md backdrop-blur-sm">
              <Star className="w-3 h-3 fill-white/50" />
              <span>{rating}</span>
            </div>
          )}
          {!companiesCount && !reviewsCount && (
             <div className="flex items-center gap-1.5 text-xs text-white/90 bg-black/10 px-2 py-1 rounded-md backdrop-blur-sm">
               <Zap className="w-3 h-3" />
               <span>Ver opÃ§Ãµes</span>
             </div>
          )}
        </div>
      </div>
    </Link>
  );
}

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\CategoryCardMinimal.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\CategoryCardMinimal.tsx.Extension).Replace(".", ""))
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Package, Layers, Star } from 'lucide-react';
import Image from 'next/image';
import { buildCategoryPath } from '@/lib/slug';

interface CategoryCardMinimalProps {
  category: {
    id: number;
    name: string;
    short_description?: string;
    logo?: { url: string } | null;
    banner_url?: string | null;
    icon_url?: string | null;
    seo_url?: string;
    companies_count?: number;
    products_count?: number;
    reviews_count?: number;
  };
  className?: string;
}

export default function CategoryCardMinimal({ category, className = "" }: CategoryCardMinimalProps) {
  const [imageError, setImageError] = useState(false);

  // Prioridade: icon_url > logo > banner_url > placeholder
  const iconUrl = category?.icon_url;
  const logoUrl = category?.logo?.url;
  const imageUrl = !imageError && (iconUrl || logoUrl || category?.banner_url)
    ? (iconUrl || logoUrl || category.banner_url)
    : null;

  const displayData = {
    name: category?.name || 'Categoria',
    description: category?.short_description || '',
    companies_count: category?.companies_count ?? 0,
    products_count: category?.products_count ?? 0,
    reviews_count: category?.reviews_count ?? 0,
    seo_url: buildCategoryPath(category?.seo_url, category?.id),
  };

  return (
    <div
      className={`group relative bg-white border border-gray-200 rounded-lg p-4 
                  hover:shadow-lg hover:border-gray-300 transition-all duration-200 ${className}`}
    >
      {/* Header: Nome e Contadores */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900 flex-1 leading-tight">
          {displayData.name}
        </h3>
        
        {/* Contadores no canto superior direito */}
        <div className="flex flex-col items-end gap-1 ml-2">
          {displayData.companies_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Building2 className="h-3.5 w-3.5" />
              <span className="font-medium">{displayData.companies_count}</span>
            </div>
          )}
          {displayData.products_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Package className="h-3.5 w-3.5" />
              <span className="font-medium">{displayData.products_count}</span>
            </div>
          )}
          {displayData.reviews_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Star className="h-3.5 w-3.5 fill-amber-500" />
              <span className="font-medium">{displayData.reviews_count}</span>
            </div>
          )}
        </div>
      </div>

      {/* Logo/Ãcone Centralizado */}
      {/* Ãrea central da imagem: altura fixa com preenchimento sem distorcer em mobile */}
      <div className="flex items-center justify-center mb-4 h-32">
        {imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt={displayData.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 
                          flex items-center justify-center border border-blue-200">
            <Layers className="h-10 w-10 text-blue-600" />
          </div>
        )}
      </div>

      {/* DescriÃ§Ã£o (se houver) */}
      {displayData.description && (
        <p className="text-sm text-gray-600 text-center line-clamp-2 leading-snug">
          {displayData.description}
        </p>
      )}

      {/* Overlay clicÃ¡vel */}
      <Link
        href={displayData.seo_url}
        className="absolute inset-0 z-10"
        aria-label={`Ver categoria ${displayData.name}`}
      />
    </div>
  );
}

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\CategoryDropdown.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\CategoryDropdown.tsx.Extension).Replace(".", ""))
'use client';



import * as React from 'react';

import Link from 'next/link';

import { motion, AnimatePresence } from 'framer-motion';

import { ChevronDown, Zap, Sun, Battery, Activity } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useCategories } from '@/hooks/useCategories';

import { Category } from '@/lib/api';

import { cn } from '@/lib/utils';

import { usePathname } from 'next/navigation';



// Helper to pick an icon based on category name (just for visual flair)

const getCategoryIcon = (name: string) => {

  const n = name.toLowerCase();

  if (n.includes('painel') || n.includes('mÃ³dulo')) return Sun;

  if (n.includes('inversor')) return Zap;

  if (n.includes('bateria')) return Battery;

  return Activity;

};



export default function CategoryDropdown() {

  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { categories, loading, error, refresh } = useCategories(true); // Fetch all active categories
  const pathname = usePathname();

  const activeCategorySlug = React.useMemo(() => {
    if (!pathname) return '';
    const parts = pathname.split('/categories/');
    if (parts.length < 2) return '';
    return parts[1].split('/')[0].split('?')[0];
  }, [pathname]);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close when path changes (navigation occurred)
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Toggle dropdown
  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };



  return (

    <div className="relative" ref={containerRef}>

      <Button
        variant="ghost"
        className={cn(
          "flex items-center gap-1 font-medium transition-colors bg-[#14b8a6] hover:bg-[#0d9488] text-white hover:text-white",
          isOpen && "bg-[#0d9488] text-white"
        )}
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Categorias
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
      </Button>



      <AnimatePresence>

        {isOpen && (

          <motion.div

            initial={{ opacity: 0, y: 10, scale: 0.95 }}

            animate={{ opacity: 1, y: 0, scale: 1 }}

            exit={{ opacity: 0, y: 10, scale: 0.95 }}

            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 w-[85vw] md:w-[600px] max-w-[600px] rounded-xl border border-border bg-popover p-4 shadow-lg shadow-black/5 outline-none z-[1001] origin-top-left"
          >

            <div className="grid grid-cols-2 gap-4">

              {/* Header/Info Section inside dropdown */}

              <div className="col-span-2 mb-2 pb-2 border-b border-border/50">

                 <h4 className="text-sm font-semibold text-foreground">Explore por Categoria</h4>

                 <p className="text-xs text-muted-foreground">Encontre os melhores produtos e serviÃ§os.</p>

              </div>



              {loading ? (

                <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">

                  Carregando categorias...

                </div>

              ) : error ? (

                <div className="col-span-2 py-8 text-center text-sm text-destructive">

                  Erro ao carregar. 

                  <Button variant="link" size="sm" onClick={() => refresh()} className="ml-2">Tentar novamente</Button>

                </div>

              ) : (

                categories.map((category) => {

                  const Icon = getCategoryIcon(category.name);

                  const isActive = Boolean(

                    activeCategorySlug &&

                      (category.seo_url === activeCategorySlug || String(category.id) === activeCategorySlug)

                  );

                  return (

                    <Link
                      key={category.id}
                      href={`/categories/${category.seo_url || category.id}`}
                      onClick={() => setIsOpen(false)}
                      className={cn(

                        'group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent',

                        isActive && 'bg-primary text-white shadow-lg'

                      )}

                      aria-current={isActive ? 'page' : undefined}

                    >

                      <div

                        className={cn(

                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors',

                          isActive

                            ? 'bg-white group-hover:bg-white border-white'

                            : 'bg-muted group-hover:bg-background group-hover:border-border'

                        )}

                      >

                        <Icon

                          className={cn(

                            'h-5 w-5 transition-colors',

                            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'

                          )}

                        />

                      </div>

                      <div className="space-y-1">

                        <p

                          className={cn(

                            'text-sm font-medium leading-none transition-colors',

                            isActive ? 'text-white' : 'group-hover:text-primary'

                          )}

                        >

                          {category.name}

                        </p>

                        <p

                          className={cn(

                            'text-xs line-clamp-2 transition-colors',

                            isActive ? 'text-white/80' : 'text-muted-foreground'

                          )}

                        >

                          {category.description || 'Produtos e servi?os de alta qualidade.'}

                        </p>

                      </div>

                    </Link>

                  );

                })

              )}

              

              {!loading && !error && categories.length === 0 && (

                 <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">

                   Nenhuma categoria encontrada.

                 </div>

              )}

            </div>

            

            <div className="mt-4 pt-3 border-t border-border/50 flex justify-end">
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link href="/categories">
                  <span>Ver todas as categorias â†’</span>
                </Link>
              </Button>
            </div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>

  );

}


`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\CategoryDropdownItem.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\components\CategoryDropdownItem.tsx.Extension).Replace(".", ""))
import React, { useState } from 'react';
import Link from 'next/link';
import { Category } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { buildCategoryPath } from '@/lib/slug';
import { ChevronRight } from 'lucide-react';

interface CategoryDropdownItemProps {
  category: Category;
  onSelect: () => void;
}

const CategoryDropdownItem: React.FC<CategoryDropdownItemProps> = ({
  category,
  onSelect,
}) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  const hasSubcategories = category.subcategories && category.subcategories.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => hasSubcategories && setIsSubMenuOpen(true)}
      onMouseLeave={() => isSubMenuOpen && setIsSubMenuOpen(false)}
    >
      <Link
        href={buildCategoryPath(category.seo_url, category.id)}
        className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={onSelect}
      >
        {category.name}
        {hasSubcategories && (
          <ChevronRight className={`h-4 w-4 transition-transform ${isSubMenuOpen ? 'rotate-90' : ''}`} />
        )}
      </Link>

      <AnimatePresence>
        {isSubMenuOpen && hasSubcategories && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-full top-0 mt-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          >
            <div className="py-1">
              {category.subcategories?.map((sub: Category) => (
                <Link
                  key={sub.id}
                  href={buildCategoryPath(sub.seo_url, sub.id)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={onSelect}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryDropdownItem;

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\hooks\useCategory.ts
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de suporte Ã  funcionalidade de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\hooks\useCategory.ts.Extension).Replace(".", ""))
'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/lib/api';
import { categoriesApiSafe } from '@/lib/api-client';

export function useCategory(identifier: number | string) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        let data;
        if (typeof identifier === 'number') {
          data = await categoriesApiSafe.getById(identifier);
        } else {
          data = await categoriesApiSafe.getBySlug(identifier);
        }
        setCategory(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(`Falha ao buscar categoria ${identifier}`));
        console.error(`Erro ao buscar categoria ${identifier}:`, err);
      } finally {
        setLoading(false);
      }
    };

    if (identifier) {
      fetchCategory();
    } else {
      setLoading(false);
      setCategory(null);
    }
  }, [identifier]);

  return { category, loading, error };
}

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\hooks\useCategoryByIdOrSlug.ts
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de suporte Ã  funcionalidade de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\hooks\useCategoryByIdOrSlug.ts.Extension).Replace(".", ""))
import { useState, useEffect, useCallback } from 'react';
import { categoriesApiSafe } from '@/lib/api-client';
import { Category } from '@/lib/api';

export function useCategoryByIdOrSlug(identifier: string | number | null) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCategory = useCallback(async () => {
    if (!identifier) {
      setCategory(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let fetchedCategory: Category | null = null;

      if (typeof identifier === 'number' || (typeof identifier === 'string' && !isNaN(Number(identifier)))) {
        // Assume it's an ID if it's a number or a string that can be converted to a number
        fetchedCategory = await categoriesApiSafe.getById(Number(identifier));
      } else if (typeof identifier === 'string') {
        // Otherwise, assume it's a slug
        fetchedCategory = await categoriesApiSafe.getBySlug(identifier);
      }
      
      setCategory(fetchedCategory);
    } catch (err) {
      console.error(`Falha ao carregar categoria com identificador ${identifier}:`, err);
      setError(err instanceof Error ? err : new Error('Erro interno no servidor'));
      setCategory(null);
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    loadCategory();
  }, [loadCategory]);

  return {
    category,
    loading,
    error,
    refresh: loadCategory,
  };
}
`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\tests\category-images.spec.ts
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de suporte Ã  funcionalidade de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\tests\category-images.spec.ts.Extension).Replace(".", ""))
import { test, expect } from '@playwright/test'

test.describe('Categoria - banners e logos', () => {
  const categoryUrl = 'http://localhost:3000/categories/paineis-solares'

  test('Banner de categoria deve carregar ou exibir fallback', async ({ page }) => {
    await page.goto(categoryUrl)
    const bannerImg = page.locator('img[alt^="Banner da categoria"]')
    const exists = await bannerImg.count()
    if (exists > 0) {
      await expect(bannerImg.first()).toBeVisible()
    } else {
      // Fallback: container presente mesmo sem imagem
      const container = page.locator('div.relative.w-full.h-48')
      await expect(container.first()).toBeVisible()
    }
  })

  test('Logos e banners de empresas renderizam ou placeholders', async ({ page }) => {
    await page.goto(categoryUrl)
    const cards = page.locator('[data-testid="company-card"]')
    await expect(cards.first()).toBeVisible()

    const logos = page.locator('[data-testid="company-logo"]')
    const banners = page.locator('[data-testid="company-banner"]')

    // Pelo menos um logo ou placeholder deve existir
    await expect(logos.or(page.locator('[data-testid="logo-placeholder"]')).first()).toBeVisible()

    // Banners podem nÃ£o existir; quando existir, deve estar visÃ­vel
    if (await banners.count() > 0) {
      await expect(banners.first()).toBeVisible()
    }
  })
})


`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\__tests__\components\CategoryCard.test.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de renderizaÃ§Ã£o visual do card ou lista de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\__tests__\components\CategoryCard.test.tsx.Extension).Replace(".", ""))
import { render, screen } from '@testing-library/react';
import CategoryCard from '@/components/CategoryCard';
import { Category } from '@/types';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, fill, ...props }: { src: string; alt: string; width?: number; height?: number; fill?: boolean }) => (
    <img src={src} alt={alt} width={width} height={height} {...props} data-testid="mock-image" />
  ),
}));

// Mock the next/link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

describe('CategoryCard', () => {
  const mockCategory: Category = {
    id: 1,
    name: 'PainÃ©is Solares',
    description: 'Tecnologia solar de Ãºltima geraÃ§Ã£o',
    short_description: 'PainÃ©is solares de alta eficiÃªncia para residÃªncias e empresas',
    seo_url: 'painel-solar',
    seo_title: 'PainÃ©is Solares - Tecnologia Solar de Ãšltima GeraÃ§Ã£o',
    featured: true,
    status: 'active',
    kind: 'product',
    parent_id: null,
    companies_count: 50,
    subcategories: [],
    banner_url: '/images/category-placeholder.svg',
    logo: {
      url: '/images/category-logo.svg',
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  it('renders only the banner image', () => {
    render(<CategoryCard category={mockCategory} />);

    const image = screen.getByTestId('mock-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/category-placeholder.svg');
    expect(image).toHaveAttribute('alt', 'Banner da categoria PainÃ©is Solares');

    // UI simplificada: nÃ£o deve renderizar textos/CTA
    expect(screen.queryByText('PainÃ©is Solares')).not.toBeInTheDocument();
    expect(screen.queryByText(/Explorar/i)).not.toBeInTheDocument();
  });

  it('renders category link with correct SEO URL', () => {
    render(<CategoryCard category={mockCategory} />);

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/categories/painel-solar');
  });

  it('handles category without optional data gracefully (banner fallback)', () => {
    const minimalCategory: Category = {
      id: 2,
      name: 'Minimal Category',
      description: 'A category with minimal data',
      seo_url: 'minimal-category',
      seo_title: 'Minimal Category',
      featured: false,
      status: 'active',
      kind: 'product',
      parent_id: null,
      companies_count: 0,
      subcategories: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    render(<CategoryCard category={minimalCategory} />);

    const image = screen.getByTestId('mock-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/category-placeholder.svg');
  });

  it('does not crash when name/description are missing', () => {
    const emptyCategory: any = {
      id: 3,
      seo_url: 'empty-category',
      featured: false,
      status: 'active',
      kind: 'product',
      parent_id: null,
      companies_count: 0,
      subcategories: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    render(<CategoryCard category={emptyCategory} />);

    // Deve renderizar banner (placeholder) e link, sem depender de textos.
    const image = screen.getByTestId('mock-image');
    expect(image).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});
`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\__tests__\navigation\CategoryNavigation.test.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de suporte Ã  funcionalidade de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\__tests__\navigation\CategoryNavigation.test.tsx.Extension).Replace(".", ""))
import { render, screen } from '@testing-library/react';
import CategoryCard from '@/components/CategoryCard';
import CategoryCardMinimal from '@/components/CategoryCardMinimal';
import CategoryDropdownItem from '@/components/CategoryDropdownItem';
import { Category } from '@/lib/api';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="mock-image" />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Category navigation flows', () => {
  const slug = 'carros-eletricos-recarga';
  const baseCategory: Category = {
    id: 42,
    name: 'Carros ElÃ©tricos e Recarga',
    description: 'Hub de categorias para recarga EV',
    short_description: 'Hub de categorias para recarga EV',
    seo_url: slug,
    seo_title: 'Carros ElÃ©tricos e Recarga',
    featured: true,
    status: 'active',
    kind: 'standard',
    parent_id: null,
    companies_count: 2,
    subcategories: [],
    banner_url: '/images/category-placeholder.svg',
    logo: { url: '/images/category-logo.svg' },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  it('CategoryCard links to /categories/<slug>', () => {
    render(<CategoryCard category={baseCategory} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/categories/${slug}`);
  });

  it('CategoryCardMinimal overlay links to /categories/<slug>', () => {
    render(<CategoryCardMinimal category={baseCategory} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/categories/${slug}`);
  });

  it('Navbar dropdown item uses /categories/<slug> for main and subcategory', () => {
    const catWithSub = {
      ...baseCategory,
      subcategories: [{ ...baseCategory, id: 43, name: 'Subcat', seo_url: 'subcat' }],
    } as Category;
    render(<CategoryDropdownItem category={catWithSub} onSelect={() => {}} />);
    const mainLink = screen.getByRole('link', { name: /Carros ElÃ©tricos e Recarga/i });
    expect(mainLink).toHaveAttribute('href', `/categories/${slug}`);
  });
});


`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\CategoryClientComponent_restore.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de suporte Ã  funcionalidade de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\CategoryClientComponent_restore.tsx.Extension).Replace(".", ""))

`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\test-category-images.js
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de suporte Ã  funcionalidade de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\test-category-images.js.Extension).Replace(".", ""))
// Teste para verificar o que estÃ¡ sendo retornado da API de categorias
import { categoriesApi } from '@/lib/api-client';

async function testCategoryCompanies() {
  try {
    console.log('=== Teste de API de Categorias ===');
    
    // Buscar a categoria paineis-solares
    const categories = await categoriesApi.getAll();
    console.log('Categorias disponÃ­veis:', categories.map(c => ({ id: c.id, name: c.name, seo_url: c.seo_url })));
    
    const category = categories.find(c => c.seo_url === 'paineis-solares');
    if (!category) {
      console.error('Categoria paineis-solares nÃ£o encontrada');
      return;
    }
    
    console.log('Categoria encontrada:', { id: category.id, name: category.name });
    
    // Buscar empresas da categoria
    const companies = await categoriesApi.getCompanies(category.id, { status: 'active' });
    console.log(`Empresas encontradas: ${companies.length}`);
    
    companies.forEach((company, index) => {
      console.log(`\n--- Empresa ${index + 1}: ${company.name} ---`);
      console.log('ID:', company.id);
      console.log('Banner URL:', company.banner_url);
      console.log('Logo URL:', company.logo_url);
      console.log('Status:', company.status);
      console.log('Verified:', company.verified);
      console.log('Campos disponÃ­veis:', Object.keys(company));
      
      // Testar se as URLs sÃ£o vÃ¡lidas
      if (company.banner_url) {
        console.log('Banner URL vÃ¡lida:', company.banner_url.startsWith('http'));
      }
      if (company.logo_url) {
        console.log('Logo URL vÃ¡lida:', company.logo_url.startsWith('http'));
      }
    });
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Executar o teste
testCategoryCompanies();
`

---

### Arquivo: C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\_CategoryClientComponent_HEAD.tsx
- **Responsabilidade:** ResponsÃ¡vel pela lÃ³gica de suporte Ã  funcionalidade de categorias.
- **CÃ³digo-Fonte:**

`$((C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\_CategoryClientComponent_HEAD.tsx.Extension).Replace(".", ""))

`

---

## 4. Oportunidades de Melhoria
1. **Cache de Fragmento:** Implementar cache em nÃ­vel de componente no frontend para evitar re-renders de cards estÃ¡ticos.
2. **Lazy Loading de Imagens:** Garantir que os banners das categorias utilizem 
ext/image com priority para as primeiras da lista.
3. **MÃ©tricas AssÃ­ncronas:** Mover o update_metrics! do backend para um worker (Sidekiq) para nÃ£o onerar o tempo de resposta do CRUD.
4. **Filtros DinÃ¢micos:** Adicionar debounce na busca de categorias para reduzir chamadas Ã  API.

## 5. DependÃªncias CrÃ­ticas
- **Backend:** ActiveRecord, JSON Serializer.
- **Frontend:** Next.js App Router, Tailwind CSS (estilizaÃ§Ã£o dos cards).
- **Banco de Dados:** PostgreSQL (suporte a slugs e busca textual).

---
*Gerado automaticamente pelo assistente de desenvolvimento.*
