# Find the permit_params line and update it to include :banner and company_ids
permit_params :name, :description, :short_description, :seo_url, :seo_title, 
              :featured, :status, :kind, :parent_id, :banner, company_ids: []

# Make sure you have the form configuration that includes the banner and company_ids
form do |f|
  f.inputs do
    f.input :name
    f.input :description
    f.input :short_description
    f.input :seo_url
    f.input :seo_title
    f.input :featured
    f.input :status, as: :select, collection: Category.statuses.keys
    f.input :kind, as: :select, collection: Category.kinds.keys
    f.input :parent_id, as: :select, collection: Category.all.map { |c| [c.name, c.id] }
    f.input :banner, as: :file, hint: f.object.banner.attached? ? image_tag(url_for(f.object.banner), style: 'max-width: 200px') : content_tag(:span, "No banner yet")
    f.input :companies, as: :check_boxes, collection: Company.all
  end
  f.actions
end