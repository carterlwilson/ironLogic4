Go into plan mode.

Forget that endpoint. I configured it to use the /health endpoint, and now
the logs look like this:

(node:15) [MONGOOSE] Warning: Duplicate schema index on {"templateId":1} found. This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
[STARTUP] MongoDB connected successfully
[STARTUP] Database connection complete, starting HTTP server...
[STARTUP] ✓ Server successfully running on port 8080
[STARTUP] Server is ready to accept connections
[REQUEST] GET /health from ::ffff:100.64.0.2
[HEALTH CHECK] Health endpoint hit
Stopping Container
npm error Lifecycle script `start` failed with error:
npm error path /app/packages/server
npm error workspace @ironlogic4/server@1.0.0
npm error location /app/packages/server
npm error command failed
npm error signal SIGTERM
npm error command sh -c node dist/index.js

I can run a curl to that endpoint and get the following response:
{"status":"OK","timestamp":"2025-11-04T17:52:38.627Z"}
Railway is expecting a 200 status, should that response have 200 somewhere in it?