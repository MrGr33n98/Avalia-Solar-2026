# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User, type: :model do
  describe '#gamification_level' do
    let(:user) { create(:user, role: 'review', city: 'São Paulo', state: 'SP', name: 'Test User') }

    context 'with low score' do
      before do
        allow(user).to receive(:calculate_green_score).and_return(50)
      end

      it 'returns beginner level' do
        level = user.gamification_level
        expect(level[:key]).to eq('beginner')
        expect(level[:name]).to eq('Iniciante')
        expect(level[:next]).to eq('Bronze')
        expect(level[:progress]).to eq(50)
        expect(level[:threshold]).to eq(100)
      end
    end

    context 'with bronze score' do
      before do
        allow(user).to receive(:calculate_green_score).and_return(250)
      end

      it 'returns bronze level' do
        level = user.gamification_level
        expect(level[:key]).to eq('bronze')
        expect(level[:name]).to eq('Bronze')
        expect(level[:next]).to eq('Prata')
        expect(level[:progress]).to eq(38) # (250-100)/400 = 150/400 = 37.5% -> 38%
        expect(level[:threshold]).to eq(500)
      end
    end

    context 'with silver score' do
      before do
        allow(user).to receive(:calculate_green_score).and_return(600)
      end

      it 'returns silver level' do
        level = user.gamification_level
        expect(level[:key]).to eq('silver')
        expect(level[:name]).to eq('Prata')
        expect(level[:next]).to eq('Ouro')
        expect(level[:progress]).to eq(10) # (600-500)/1000 = 100/1000 = 10%
        expect(level[:threshold]).to eq(1500)
      end
    end

    context 'with gold score' do
      before do
        allow(user).to receive(:calculate_green_score).and_return(2000)
      end

      it 'returns gold level' do
        level = user.gamification_level
        expect(level[:key]).to eq('gold')
        expect(level[:name]).to eq('Ouro')
        expect(level[:next]).to eq('Platina')
        expect(level[:progress]).to eq(14) # (2000-1500)/3500 = 500/3500 = 14%
        expect(level[:threshold]).to eq(5000)
      end
    end

    context 'with platinum score' do
      before do
        allow(user).to receive(:calculate_green_score).and_return(6000)
      end

      it 'returns platinum level' do
        level = user.gamification_level
        expect(level[:key]).to eq('platinum')
        expect(level[:name]).to eq('Platina')
        expect(level[:next]).to be_nil
        expect(level[:progress]).to eq(100)
        expect(level[:threshold]).to eq(5000)
      end
    end
  end
end
