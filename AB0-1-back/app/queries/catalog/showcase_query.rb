# frozen_string_literal: true

module Catalog
  class ShowcaseQuery
    MAX_ITEMS = 5
    CONTRACT_VERSION = 'avalia-solar.catalog.showcase.v1'

    def initialize(company:, tab: 'all', limit: MAX_ITEMS)
      @company = company
      @requested_tab = tab.to_s.strip.presence || 'all'
      @limit = [limit.to_i, 1].max
      @limit = MAX_ITEMS if @limit > MAX_ITEMS
    end

    def call
      tabs = build_tabs
      effective_tab = resolve_effective_tab(tabs)

      items, total_count = fetch_items_for_tab(effective_tab)
      serialized_items = serialize_items(items)

      {
        data: {
          company_id: company.id,
          selected_tab: effective_tab,
          tabs: tabs,
          items: serialized_items,
          max_items: MAX_ITEMS,
          has_more: total_count > serialized_items.size,
          total_count: total_count
        },
        meta: {
          contract: CONTRACT_VERSION,
          generated_at: Time.current.iso8601
        }
      }
    end

    private

    attr_reader :company, :requested_tab, :limit

    def eligible_product_ids
      @eligible_product_ids ||= begin
        owned_ids = company.products.active_status.pluck(:id)
        linked_ids = CompanyProduct.joins(:product)
                                   .where(company_id: company.id, status: 'active')
                                   .merge(Product.active_status)
                                   .pluck(:product_id)
        (owned_ids + linked_ids).uniq
      end
    end

    def eligible_products_scope
      Product.active_status.where(id: eligible_product_ids)
    end

    def eligible_services_scope
      company.company_services.active_status
    end

    def category_counts
      @category_counts ||= begin
        return [] if eligible_product_ids.empty?

        Category
          .joins(:products)
          .where(products: { id: eligible_product_ids })
          .group('categories.id, categories.name, categories.seo_url')
          .select('categories.id, categories.name, categories.seo_url, COUNT(DISTINCT products.id) AS products_count')
          .order('categories.name ASC')
      end
    end

    def services_count
      @services_count ||= eligible_services_scope.count
    end

    def total_catalog_count
      @total_catalog_count ||= eligible_products_scope.count + services_count
    end

    def build_tabs
      return [] if total_catalog_count.zero?

      tab_list = []
      tab_list << { key: 'all', label: 'Todos', count: total_catalog_count }

      category_counts.each do |cat|
        count = cat.read_attribute(:products_count).to_i
        next if count.zero?

        tab_list << {
          key: "category:#{cat.id}",
          label: cat.name,
          count: count
        }
      end

      if services_count.positive?
        tab_list << {
          key: 'services',
          label: 'Serviços',
          count: services_count
        }
      end

      tab_list
    end

    def resolve_effective_tab(tabs)
      return 'all' if tabs.empty?
      return requested_tab if tabs.any? { |t| t[:key] == requested_tab }

      'all'
    end

    def fetch_items_for_tab(tab)
      if tab == 'all'
        fetch_all_items
      elsif tab == 'services'
        fetch_service_items
      elsif tab.start_with?('category:')
        category_id = tab.split(':').last.to_i
        fetch_category_items(category_id)
      else
        fetch_all_items
      end
    end

    def fetch_all_items
      products = eligible_products_scope
                 .includes(:categories, :brand, images_attachments: :blob)
                 .order(Arel.sql('products.featured DESC NULLS LAST, products.updated_at DESC, products.id DESC'))
                 .limit(limit)
                 .to_a

      items = products
      if items.size < limit && services_count.positive?
        remaining = limit - items.size
        services = eligible_services_scope
                   .includes(:category, images_attachments: :blob)
                   .order(updated_at: :desc, id: :desc)
                   .limit(remaining)
                   .to_a
        items += services
      end

      [items, total_catalog_count]
    end

    def fetch_service_items
      services = eligible_services_scope
                 .includes(:category, images_attachments: :blob)
                 .order(updated_at: :desc, id: :desc)
                 .limit(limit)
                 .to_a

      [services, services_count]
    end

    def fetch_category_items(category_id)
      cat_products = eligible_products_scope
                     .joins(:categories)
                     .where(categories: { id: category_id })
                     .includes(:categories, :brand, images_attachments: :blob)
                     .order(Arel.sql('products.featured DESC NULLS LAST, products.updated_at DESC, products.id DESC'))
                     .limit(limit)
                     .to_a

      total_for_cat = eligible_products_scope
                      .joins(:categories)
                      .where(categories: { id: category_id })
                      .distinct
                      .count

      [cat_products, total_for_cat]
    end

    def serialize_items(items)
      items.each_with_index.map do |item, index|
        if item.is_a?(Product)
          serialize_product(item, index + 1)
        elsif item.is_a?(CompanyService)
          serialize_service(item, index + 1)
        end
      end.compact
    end

    def serialize_product(product, position)
      main_cat = product.categories.first

      {
        id: "product:#{product.id}",
        type: 'product',
        product_id: product.id,
        service_id: nil,
        name: product.name,
        short_description: product.short_description.presence || product.description&.truncate(120),
        image_url: product.image_urls.first || product.image_url,
        category: {
          id: main_cat&.id || 0,
          name: main_cat&.name || 'Geral',
          slug: main_cat&.seo_url || 'geral'
        },
        position: position,
        cta: {
          label: 'Ver produto',
          href: product_href(product)
        }
      }
    end

    def serialize_service(service, position)
      cat = service.category

      {
        id: "service:#{service.id}",
        type: 'service',
        service_id: service.id,
        product_id: nil,
        name: service.name,
        short_description: service.description&.truncate(120),
        image_url: service_image_url(service),
        category: {
          id: cat&.id || 0,
          name: cat&.name || 'Serviços',
          slug: cat&.seo_url || 'servicos'
        },
        position: position,
        cta: {
          label: 'Ver serviço',
          href: service_href(service)
        }
      }
    end

    def product_href(product)
      slug_val = product.respond_to?(:slug) ? product.slug.presence : nil
      slug_val ||= "#{product.id}-#{product.name.to_s.parameterize}".presence
      "/products/#{slug_val || product.id}"
    end

    def service_href(service)
      company_slug = company.slug.presence || company.id.to_s
      "/companies/#{company_slug}/services/#{service.slug.presence || service.id}"
    end

    def service_image_url(service)
      return nil unless service.images.attached?

      options = Rails.application.routes.default_url_options.dup
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
      Rails.application.routes.url_helpers.rails_storage_proxy_url(service.images.first, options)
    rescue StandardError
      nil
    end
  end
end
