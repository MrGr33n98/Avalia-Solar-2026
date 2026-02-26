class BadgeSerializer < ActiveModel::Serializer
  attributes :id, :name, :image_url, :year, :edition

  def image_url
    object.image_url
  end
end
