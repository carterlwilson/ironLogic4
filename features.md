Go into plan mode.

With the latest deployments with all the logs, this is all I'm seeing,
so it looks like we're probably hitting an issue earlier.

Starting Container
npm warn config production Use `--omit=dev` instead.
> @ironlogic4/server@1.0.0 start
> node dist/index.js
(node:15) [MONGOOSE] Warning: Duplicate schema index on {"email":1} found. This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15) [MONGOOSE] Warning: Duplicate schema index on {"templateId":1} found. This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
MongoDB connected successfully
Server running on port 8080
Stopping Container
npm error Lifecycle script `start` failed with error:
npm error path /app/packages/server
npm error workspace @ironlogic4/server@1.0.0
npm error location /app/packages/server
npm error command failed
npm error signal SIGTERM
npm error command sh -c node dist/index.js