# frozen_string_literal: true

module CompanyAi
  # Executes graph transitions only; actual business actions stay in dedicated Rails services.
  class WorkflowRunner
    def initialize(definition)
      result = WorkflowValidator.call(definition)
      raise ArgumentError, "INVALID_WORKFLOW: #{result.errors.join(',')}" unless result.valid?

      @definition = definition
      @nodes = definition.fetch('nodes').index_by { |node| node.fetch('id') }
      @edges = definition.fetch('edges')
    end

    attr_reader :definition

    def node(node_id)
      @nodes.fetch(node_id) { raise ArgumentError, 'UNKNOWN_NODE' }
    end

    def next_node_id(current_node_id:, choice: nil, context: {})
      node = node(current_node_id)
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
