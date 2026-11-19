import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getNavigationTools, handleNavigate, handleStatus } from './domains/navigation.js';
import { getAllDomainTools, getHandlerForTool } from './domains/index.js';
import { logger } from './utils/logger.js';
import { withErrorHint } from './utils/errors.js';
import type { DomainName } from './utils/types.js';

export function createServer(): Server {
  const server = new Server(
    { name: 'ncentral-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // Caller (index.ts / http.ts) is responsible for binding this server into
  // the per-request async context via runWithServerRef/bindServerRef — see
  // utils/server-ref.ts. Doing it here would set a module-level ref, the
  // exact cross-tenant bug this file used to have.

  // Expose ALL tools flat, always: the informational helpers plus every
  // domain's tools. This matches the deployed WYRE fleet and lets one-shot
  // tools/list aggregation (e.g. Conduit) see the full tool surface, rather
  // than gating tools behind a per-session navigation state machine.
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const domainTools = await getAllDomainTools();
    return { tools: [...getNavigationTools(), ...domainTools] };
  });

  // Route tools/call purely by tool name — no prior ncentral_navigate required.
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Informational / connectivity helpers.
    if (name === 'ncentral_navigate') {
      return handleNavigate(args?.domain as DomainName | undefined);
    }
    if (name === 'ncentral_status') {
      return handleStatus();
    }

    const handler = await getHandlerForTool(name);
    if (!handler) {
      return {
        content: [{ type: 'text' as const, text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      return await handler.handleCall(name, args || {});
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Tool call failed', { tool: name, error: message });
      return {
        content: [{ type: 'text' as const, text: `Error: ${withErrorHint(message)}` }],
        isError: true,
      };
    }
  });

  return server;
}
