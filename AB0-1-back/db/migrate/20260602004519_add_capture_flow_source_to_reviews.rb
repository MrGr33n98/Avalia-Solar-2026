class AddCaptureFlowSourceToReviews < ActiveRecord::Migration[7.0]
  def change
    add_column :reviews, :capture_flow_source, :string
    change_column_default :reviews, :status, from: nil, to: 0
  end
end
