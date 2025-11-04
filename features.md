Go into plan mode.

Alright great we're seeing those logs now. The new logs are here:

Starting Container
[STARTUP] ✓ Server successfully running on port 8080
[STARTUP] Server is ready to accept connections
npm warn config production Use `--omit=dev` instead.
> @ironlogic4/server@1.0.0 start
> node dist/index.js
[STARTUP] Initializing application...
[STARTUP] Starting server initialization...
[STARTUP] Node environment: development
(node:15) [MONGOOSE] Warning: Duplicate schema index on {"email":1} found. This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
[STARTUP] Port configured: 8080
[STARTUP] Attempting to connect to MongoDB...
(Use `node --trace-warnings ...` to show where the warning was created)
[STARTUP] MongoDB URI configured: YES (length: 85)
(node:15) [MONGOOSE] Warning: Duplicate schema index on {"templateId":1} found. This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
[STARTUP] MongoDB connected successfully
[STARTUP] Database connection complete, starting HTTP server...
npm error workspace @ironlogic4/server@1.0.0
npm error location /app/packages/server
npm error command failed
npm error signal SIGTERM
npm error command sh -c node dist/index.js
npm error Lifecycle script `start` failed with error:
npm error path /app/packages/server
Stopping Container