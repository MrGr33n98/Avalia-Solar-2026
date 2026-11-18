#!/usr/bin/env ruby
# frozen_string_literal: true

# Regression guard: public SDK jobs must never receive private staging
# variables/secrets, and private jobs must not receive public credentials.
require 'yaml'

WORKFLOW_DIR = File.expand_path('../workflows', __dir__)
WORKFLOW = File.join(WORKFLOW_DIR, 'mcp-c4-sdk-interop-staging.yml')
workflow = YAML.safe_load(File.read(WORKFLOW), aliases: false)
jobs = workflow.fetch('jobs')

def assert(condition, message)
  raise message unless condition
end

public = jobs.fetch('public-sdk-interop')
private_job = jobs.fetch('private-sdk-interop')

assert(!jobs.key?('sdk-interop'), 'Legacy shared SDK job must not return')
assert(public.fetch('environment') == 'mcp-staging', 'Public job must use mcp-staging')
assert(private_job.fetch('environment') == 'mcp-staging', 'Private job must use mcp-staging')
assert(!public.fetch('strategy').fetch('matrix').key?('target'), 'Public matrix must not select target')
assert(!private_job.fetch('strategy').fetch('matrix').key?('target'), 'Private matrix must not select target')

public_text = YAML.dump(public)
private_text = YAML.dump(private_job)

assert(!public_text.include?('MCP_STAGING_PRIVATE'), 'Public job contains private MCP context')
assert(!public_text.include?('secrets.MCP_STAGING_PRIVATE'), 'Public job references private secret')
assert(!private_text.include?('secrets.MCP_STAGING_ACCESS_TOKEN'), 'Private job references public secret')
assert(!private_text.include?('vars.MCP_STAGING_RESOURCE_URL'), 'Private job references public resource')

assert(public.dig('env', 'MCP_SDK_TARGET') == 'public', 'Public target must be fixed')
assert(private_job.dig('env', 'MCP_SDK_TARGET') == 'private', 'Private target must be fixed')
assert(public.dig('env', 'MCP_STAGING_ACCESS_TOKEN') == '${{ secrets.MCP_STAGING_ACCESS_TOKEN }}',
       'Public token must come only from the public secret')
assert(private_job.dig('env', 'MCP_STAGING_PRIVATE_ACCESS_TOKEN') == '${{ secrets.MCP_STAGING_PRIVATE_ACCESS_TOKEN }}',
       'Private token must come only from the private secret')

[public, private_job].each do |job|
  job.fetch('steps').each do |step|
    uses = step['uses']
    next unless uses

    assert(uses.match?(/@[0-9a-f]{40}(?:\s+#.*)?\z/), "Unpinned action in C4 workflow: #{uses}")
  end
end

def action_refs(value, refs = [])
  case value
  when Hash
    refs << value['uses'] if value['uses']
    value.each_value { |child| action_refs(child, refs) }
  when Array
    value.each { |child| action_refs(child, refs) }
  end
  refs
end

Dir.glob(File.join(WORKFLOW_DIR, 'mcp-*.yml')).each do |path|
  refs = action_refs(YAML.safe_load(File.read(path), aliases: false))
  refs.each do |uses|
    assert(uses.match?(/@[0-9a-f]{40}(?:\s+#.*)?\z/), "Unpinned MCP action: #{uses}")
  end
end

puts 'PASS: MCP C4 SDK workflow has isolated public/private secret contexts and SHA-pinned actions'
