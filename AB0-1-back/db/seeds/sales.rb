module Seeds
  module Sales
    def self.run!
      pipeline = ::Sales::Pipeline.find_or_create_by!(key: 'b2b_sales') { |record| record.name = 'Avalia Solar B2B Sales' }
      stages = [
        %w[prospect Prospect 10], %w[contacted Contacted 20], %w[qualified Qualified 35],
        %w[discovery Discovery 50], %w[proposal Proposal 70], %w[negotiation Negotiation 85],
        ['won', 'Closed Won', '100', 'won'], ['lost', 'Closed Lost', '0', 'lost']
      ]
      stages.each_with_index do |(key, name, probability, terminal), position|
        pipeline.stages.find_or_create_by!(key:) do |stage|
          stage.name = name; stage.position = position; stage.probability = probability; stage.terminal_type = terminal
        end
      end
    end
  end
end
