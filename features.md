Go into plan mode.

The image for the server is deploying successfully in Railway now, but I'm
seeing the following error in the run logs, do you know why?
node:internal/modules/esm/loader:352
throw new ERR_REQUIRE_ESM(url, true);
^
Error [ERR_REQUIRE_ESM]: require() of ES Module file:///app/node_modules/zod/index.js not supported.
at TracingChannel.traceSync (node:diagnostics_channel:315:14) {
code: 'ERR_REQUIRE_ESM'
}
Node.js v22.11.0
npm error Lifecycle script `start` failed with error:
npm error code 1
npm warn config production Use `--omit=dev` instead.
