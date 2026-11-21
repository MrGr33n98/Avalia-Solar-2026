# frozen_string_literal: true

module CompanyAi
  # Executes graph transitions only; actual business actions stay in dedicated Rails services.
  class WorkflowRunner
    def initialize(definition)
      result = WorkflowValidator.call(definition)
      raise ArgumentError, "INVALID_WORKFLOW: #{result.errors.join(',')}" unless result.valid?

      @nodes = definition.fetch('nodes').index_by { |node| node.fetch('id') }
      @edges = definition.fetch('edges')
    end

    def next_node_id(current_node_id:, choice: nil, context: {})
      node = @nodes.fetch(current_node_id) { raise ArgumentError, 'UNKNOWN_NODE' }
      return nil if node['type'] == 'end'

      edges = @edges.select { |edge| edge['from'] == current_node_id }
      if node['type'] == 'choice'
        edge = edges.find { |item| item['choice'] == choice }
        raise ArgumentError, 'INVALID_CHOICE' unless edge

        return edge.fetch('to')
      end
      if node['type'] == 'condition'
        decision = context[node.fetch('condition')] == true
        edge = edges.find { |item| item['branch'] == (decision ? 'true' : 'false') }
        raise ArgumentError, 'MISSING_BRANCH' unless edge

        return edge.fetch('to')
      end

      raise ArgumentError, 'AMBIGUOUS_TRANSITION' unless edges.size == 1

      edges.first.fetch('to')
    end
  end
end
