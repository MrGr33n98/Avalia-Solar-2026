class Post < ApplicationRecord
  validates :title, presence: true, length: { minimum: 5, maximum: 50 }
  validates :body, presence: true
  belongs_to :user

  # Definindo os atributos que podem ser pesquisados
  def self.ransackable_attributes(_auth_object = nil)
    %w[title body]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
