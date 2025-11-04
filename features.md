Go into plan mode.

 Ok login is still not working, but let's step back and fix something else first.
 As soon as the server is deployed, I'm still seeing this error:

ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false (default). This could indicate a misconfiguration which would prevent express-rate-limit from accurately identifying users. See https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/ for more information.
at Object.xForwardedForHeader (file:///app/node_modules/express-rate-limit/dist/index.mjs:157:13)
at wrappedValidations.<computed> [as xForwardedForHeader] (file:///app/node_modules/express-rate-limit/dist/index.mjs:369:22)
at Object.keyGenerator (file:///app/node_modules/express-rate-limit/dist/index.mjs:630:20)
at file:///app/node_modules/express-rate-limit/dist/index.mjs:682:32
at async file:///app/node_modules/express-rate-limit/dist/index.mjs:663:5 {
code: 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR',
help: 'https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/'
}

That's before any request is sent to the server