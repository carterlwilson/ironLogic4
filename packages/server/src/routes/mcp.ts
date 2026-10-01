import { Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createSchedulingServer } from '../mcp/scheduling.js';
import { activeMcpConnection, eligibleMcpUser, oauthConfig, verifyMcpToken } from '../mcp/oauth.js';
import { generateToken } from '../utils/auth.js';

const router = Router();

// No shared user token: each MCP request uses its own authenticated principal.
router.post('/', async (req, res, next) => {
  try {
    const config = oauthConfig();
    if (!config) {
      res.status(503).json({ success: false, error: 'MCP OAuth is not configured' });
      return;
    }
    let userId: string;
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) throw new Error('Missing token');
      const claims = verifyMcpToken(header.slice('Bearer '.length), config);
      userId = claims.userId;
      if (!await eligibleMcpUser(userId, config)) throw new Error('User unavailable');
      if (claims.connectionId) {
        const connection = await activeMcpConnection(claims.connectionId, config, userId);
        if (!connection || connection.scope !== claims.scope) throw new Error('Connection unavailable');
      }
    } catch {
      res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${config.origin}/.well-known/oauth-protected-resource/mcp", scope="scheduling"`);
      res.status(401).json({ success: false, error: 'MCP account linking required' });
      return;
    }
    const server = createSchedulingServer(
      `http://127.0.0.1:${process.env.PORT || 3001}`,
      generateToken(userId)
    );
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      allowedOrigins: process.env.MCP_ALLOWED_ORIGINS?.split(',').map(value => value.trim()) || [config.origin, 'https://chatgpt.com'],
      enableDnsRebindingProtection: true,
      allowedHosts: [new URL(config.origin).host, `localhost:${process.env.PORT || 3001}`, `127.0.0.1:${process.env.PORT || 3001}`],
    });
    res.on('close', () => {
      void transport.close();
      void server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch {
      if (!res.headersSent) res.status(500).json({ success: false, error: 'MCP request failed' });
    }
  } catch (error) {
    next(error);
  }
});

router.all('/', (_req, res) => {
  res.setHeader('Allow', 'POST');
  res.status(405).json({ success: false, error: 'Method not allowed' });
});

export default router;
