# frozen_string_literal: true

require 'set'

module CompanyAi
  # Pure domain validation: the model never receives executable Ruby, SQL or arbitrary tools.
  class WorkflowValidator
    MAX_NODES = 25
    MAX_EDGES = 70
    NODE_TYPES = %w[message choice knowledge condition action handoff end].freeze
    ACTION_KEYS = %w[open_quote_wizard].freeze
    KNOWLEDGE_SOURCES = %w[published_products published_faq published_profile approved_materials].freeze
    CONDITIONS = %w[human_available quote_entitled].freeze
    Result = Struct.new(:errors, keyword_init: true) do
      def valid?
        errors.empty?
      end
    end

    def self.call(definition)
      new(definition).call
    end

    def initialize(definition)
      @definition = definition
      @errors = []
    end

    def call
      unless @definition.is_a?(Hash)
        return Result.new(errors: ['INVALID_DEFINITION'])
      end

      nodes = @definition['nodes']
      edges = @definition['edges']
      start = @definition['start_node_id']
      return Result.new(errors: ['INVALID_GRAPH']) unless nodes.is_a?(Array) && edges.is_a?(Array)
      @errors << 'TOO_MANY_NODES' if nodes.empty? || nodes.size > MAX_NODES
      @errors << 'TOO_MANY_EDGES' if edges.size > MAX_EDGES
      return Result.new(errors: @errors) if nodes.size > MAX_NODES || edges.size > MAX_EDGES

      node_ids = nodes.filter_map { |node| node['id'] if node.is_a?(Hash) }
      @errors << 'INVALID_NODE' unless nodes.all? { |n| n.is_a?(Hash) && valid_id?(n['id']) }
      @errors << 'DUPLICATE_NODE' if node_ids.uniq.size != node_ids.size
      @errors << 'UNKNOWN_START' unless node_ids.include?(start)
      node_by_id = nodes.select { |node| node.is_a?(Hash) && valid_id?(node['id']) }.index_by { |n| n['id'] }
      nodes.each do |node|
        next unless node.is_a?(Hash)
        type = node['type']
        @errors << "INVALID_NODE_TYPE:#{node['id']}" unless NODE_TYPES.include?(type)
        if type == 'action' && !ACTION_KEYS.include?(node['action_key'])
          @errors << "ACTION_NOT_ALLOWED:#{node['id']}"
        end
        if type == 'knowledge' && !KNOWLEDGE_SOURCES.include?(node['source'])
          @errors << "KNOWLEDGE_NOT_ALLOWED:#{node['id']}"
        end
        if type == 'condition' && !CONDITIONS.include?(node['condition'])
          @errors << "CONDITION_NOT_ALLOWED:#{node['id']}"
        end
        if type == 'choice'
          options = node['options']
          keys = Array(options).filter_map { |item| item['key'] if item.is_a?(Hash) }
          @errors << "INVALID_CHOICES:#{node['id']}" unless options.is_a?(Array) && options.length.between?(1, 6) &&
                                                                     keys.all? { |key| valid_id?(key) } && keys.uniq.size == options.size
        end
      end

      adjacency = Hash.new { |hash, key| hash[key] = [] }
      edges.each do |edge|
        unless edge.is_a?(Hash) && node_by_id.key?(edge['from']) && node_by_id.key?(edge['to'])
          @errors << 'UNKNOWN_NODE'
          next
        end
        adjacency[edge['from']] << edge['to']
        parent = node_by_id[edge['from']]
        if parent['type'] == 'choice'
          choices = Array(parent['options']).map { |o| o['key'] if o.is_a?(Hash) }
          @errors << 'INVALID_CHOICE_EDGE' unless choices.include?(edge['choice'])
        elsif edge.key?('choice')
          @errors << 'UNEXPECTED_CHOICE_EDGE'
        end
      end

      unless node_by_id.values.any? { |n| n['type'] == 'end' }
        @errors << 'MISSING_END'
      end

      node_by_id.each do |id, node|
        outgoing = adjacency[id]
        @errors << "TERMINAL_HAS_EDGES:#{id}" if node['type'] == 'end' && outgoing.any?
        @errors << "DEAD_END:#{id}" if node['type'] != 'end' && outgoing.empty?
      end

      if node_by_id.key?(start)
        visited = Set.new
        visiting = Set.new
        cycles = false
        walk = lambda do |id|
          return if visited.include?(id)
          if visiting.include?(id)
            cycles = true
            return
          end
          visiting.add(id)
          adjacency[id].each { |target| walk.call(target) }
          visiting.delete(id)
          visited.add(id)
        end
        walk.call(start)
        @errors << 'CYCLE' if cycles
        @errors << 'UNREACHABLE_NODE' unless node_by_id.keys.all? { |id| visited.include?(id) }
      end

      Result.new(errors: @errors.uniq)
    end

    private

    def valid_id?(id)
      id.is_a?(String) && id.match?(/\A[a-z][a-z0-9_]{0,63}\z/)
    end
  end
end
