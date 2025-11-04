Go into plan mode.

I'm trying to run the "magic number" trouble shooting steps on this page for 
our deployed server: https://express-rate-limit.mintlify.app/guides/troubleshooting-proxy-issues
and even trying to hit the /ip endpoint I'm seeing the following error:

ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false (default). This could indicate a misconfiguration which would prevent express-rate-limit from accurately identifying users. See https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/ for more information.
at Object.xForwardedForHeader (file:///app/node_modules/express-rate-limit/dist/index.mjs:157:13)
at wrappedValidations.<computed> [as xForwardedForHeader] (file:///app/node_modules/express-rate-limit/dist/index.mjs:369:22)
at Object.keyGenerator (file:///app/node_modules/express-rate-limit/dist/index.mjs:630:20)
at file:///app/node_modules/express-rate-limit/dist/index.mjs:682:32
help: 'https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/'
at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
}
at async file:///app/node_modules/express-rate-limit/dist/index.mjs:663:5 {
code: 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR',

That error is why I'm trying the troubleshooting on that page. We need to figure out what's going on
