require 'rails_helper'

RSpec.describe GroupTopic, type: :model do
  subject(:topic) { build(:group_topic) }

  it { is_expected.to be_valid }
  it { is_expected.to belong_to(:group) }
  it { is_expected.to validate_presence_of(:name) }
  it 'exige slug válido quando nome também está ausente' do
    topic.name = nil
    topic.slug = nil

    expect(topic).not_to be_valid
    expect(topic.errors).to include(:name, :slug)
  end
  it { is_expected.to validate_uniqueness_of(:slug).scoped_to(:group_id) }

  it 'gera slug quando ausente' do
    topic.slug = nil
    topic.valid?

    expect(topic.slug).to eq('migracao-acl')
  end
end