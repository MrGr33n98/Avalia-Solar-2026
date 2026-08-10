class AddIdempotencyFieldsToBannerEvents < ActiveRecord::Migration[7.0]
  def change
    add_column :banner_events, :delivery_id, :string unless column_exists?(:banner_events, :delivery_id)
    add_column :banner_events, :impression_instance_id, :string unless column_exists?(:banner_events, :impression_instance_id)
    add_column :banner_events, :click_instance_id, :string unless column_exists?(:banner_events, :click_instance_id)

    add_index :banner_events, :delivery_id unless index_exists?(:banner_events, :delivery_id)
    add_index :banner_events, :impression_instance_id, unique: true, where: "event_type = 'impression' AND impression_instance_id IS NOT NULL", name: 'idx_banner_events_impression_instance' unless index_exists?(:banner_events, name: 'idx_banner_events_impression_instance')
    add_index :banner_events, :click_instance_id, unique: true, where: "event_type = 'click' AND click_instance_id IS NOT NULL", name: 'idx_banner_events_click_instance' unless index_exists?(:banner_events, name: 'idx_banner_events_click_instance')
  end
end
