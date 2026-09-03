module Sales
  class Tagging < ApplicationRecord
    self.table_name = 'sales_taggings'
    belongs_to :tag, class_name: 'Sales::Tag', foreign_key: :sales_tag_id
    belongs_to :taggable, polymorphic: true
    belongs_to :created_by, class_name: 'User', optional: true
  end
end
