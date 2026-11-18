#!/usr/bin/env node
// Official MCP TypeScript SDK v2: modern 2026-07-28 STAGING ONLY.
// No credentials, user data, tool payloads or company details are logged.
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const publicNames = [
  'list_integrators', 'show_integrator_profile', 'list_solar_categories',
  'get_integrator_reputation', 'compare_integrators',
];
const privateNames = ['get_my_company_overview'];
const allowedStagingHost = /^[a-z0-9-]*staging[a-z0-9-]*\.avaliasolar\.com\.br$/i;

function configuration() {
  if (process.env.MCP_SMOKE_CONFIRMATION !== 'STAGING_ONLY') {
    throw new Error('Staging acknowledgement required');
  }
  const target = process.env.MCP_SDK_TARGET ?? 'public';
  if (!['public', 'private'].includes(target)) throw new Error('Invalid MCP SDK target');
  const prefix = target === 'private' ? 'MCP_STAGING_PRIVATE' : 'MCP_STAGING';
  const raw = process.env[prefix + '_RESOURCE_URL'];
  const token = process.env[prefix + '_ACCESS_TOKEN'];
  if (!raw || !token || token.length > 8192 || /[\r\n]/.test(token)) {
    throw new Error('Missing or invalid staging resource/token');
  }
  const url = new URL(raw);
  if (url.protocol !== 'https:' ||
      !allowedStagingHost.test(url.hostname) ||
      url.pathname !== (target === 'private' ? '/mcp/private' : '/mcp') ||
      url.search || url.hash || url.username || url.password) {
    throw new Error('Only the approved HTTPS staging MCP resource is permitted');
  }
  const company = process.env.MCP_STAGING_PRIVATE_COMPANY_ID;
  if (target === 'private' && !/^[1-9]\d*$/.test(company ?? '')) {
    throw new Error('Authorized staging company fixture is required');
  }
  return { target, url, token, company };
}

async function main() {
  const { target, url, token, company } = configuration();
  const client = new Client(
    { name: 'avalia-solar-c4-interop', version: '1.0.0' },
    { versionNegotiation: { mode: { pin: '2026-07-28' } } }
  );
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: { headers: { Authorization: 'Bearer ' + token } },
  });

  try {
    await client.connect(transport);
    if (client.getProtocolEra() !== 'modern') {
      throw new Error('Modern MCP protocol not negotiated');
    }
    const list = await client.listTools();
    const names = list.tools.map((tool) => tool.name);
    const expected = target === 'private' ? privateNames : publicNames;
    if (names.length !== expected.length || !names.every((name, i) => name === expected[i])) {
      throw new Error('Unexpected tool allowlist');
    }
    const result = target === 'private'
      ? await client.callTool({ name: 'get_my_company_overview', arguments: { company_id: Number(company) } })
      : await client.callTool({ name: 'list_solar_categories', arguments: {} });
    if (result.isError) throw new Error('Tool reported an error');
    if (target === 'private') {
      if (String(result.structuredContent?.company?.id) !== company) {
        throw new Error('Authorized company mismatch');
      }
    } else if (!Array.isArray(result.structuredContent?.data?.categories)) {
      throw new Error('Invalid categories payload');
    }
  } finally {
    await client.close();
  }
  console.log('PASS TypeScript MCP SDK v2: ' + target + ' (staging-only; no data logged)');
}
main().catch((error) => {
  // Do not print error.message: OAuth/SDK errors may include sensitive HTTP details.
  console.error('FAIL TypeScript MCP SDK v2 (' + (error?.name ?? 'Error') + ')');
  process.exitCode = 1;
});
