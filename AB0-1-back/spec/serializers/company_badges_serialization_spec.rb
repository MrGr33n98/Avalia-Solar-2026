# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompanyBadgesSerialization do
  BadgeStub = Struct.new(
    :id,
    :name,
    :description,
    :category_label,
    :year,
    :edition,
    :public_slug,
    :image_url,
    :position,
    :active,
    keyword_init: true
  ) do
    def active?
      active
    end
  end

  let(:serializer_class) do
    Class.new do
      include CompanyBadgesSerialization

      attr_reader :object

      def initialize(object)
        @object = object
      end
    end
  end

  it "serializes only active badges in display order" do
    badges = [
      BadgeStub.new(id: 3, name: "Inativo", image_url: "/inactive.png", position: 1, active: false),
      BadgeStub.new(id: 2, name: "Segundo", image_url: "/second.png", position: 2, active: true),
      BadgeStub.new(
        id: 1,
        name: "Top Brand",
        description: "Reconhecimento oficial",
        category_label: "Inversores",
        year: 2026,
        edition: "Brasil",
        public_slug: "top-brand-2026",
        image_url: "/top-brand.png",
        position: 1,
        active: true
      )
    ]
    company = instance_double(Company, id: 10, badges: badges)
    allow(company).to receive(:association).with(:badges).and_return(instance_double(ActiveRecord::Associations::Association, loaded?: true))

    result = serializer_class.new(company).badges

    expect(result.map { |badge| badge[:name] }).to eq(["Top Brand", "Segundo"])
    expect(result.first).to include(
      category: "Inversores",
      image_url: "/top-brand.png",
      public_slug: "top-brand-2026",
      year: 2026
    )
  end
end
