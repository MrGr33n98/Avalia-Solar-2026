# Add ransackable attributes to ActiveStorage models for ActiveAdmin compatibility

Rails.application.config.to_prepare do
  ActiveStorage::Attachment.class_eval do
    def self.ransackable_attributes(auth_object = nil)
      ["blob_id", "created_at", "id", "name", "record_id", "record_type"]
    end
    
    def self.ransackable_associations(auth_object = nil)
      ["blob", "record"]
    end
  end
  
  ActiveStorage::Blob.class_eval do
    def self.ransackable_attributes(auth_object = nil)
      ["byte_size", "checksum", "content_type", "created_at", "filename", "id", "key", "metadata", "service_name"]
    end
    
    def self.ransackable_associations(auth_object = nil)
      ["attachments", "variant_records"]
    end
  end
  
  # Add VariantRecord ransackable attributes
  ActiveStorage::VariantRecord.class_eval do
    def self.ransackable_attributes(auth_object = nil)
      ["blob_id", "created_at", "id", "variation_digest"]
    end
    
    def self.ransackable_associations(auth_object = nil)
      ["blob", "image_attachment", "image_blob"]
    end
  end
end