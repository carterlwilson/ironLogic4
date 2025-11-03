Go into plan mode.

Both the server and client app are deployed to preprod on railway and vercel,
and I'm seeing the following error in the server logs when I try to send a request from client to 
server (trying to login to the client app):

ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false (default). This could indicate a misconfiguration which would prevent express-rate-limit from accurately identifying users. See https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/ for more information.
at async file:///app/node_modules/express-rate-limit/dist/index.mjs:663:5 {
at Object.xForwardedForHeader (file:///app/node_modules/express-rate-limit/dist/index.mjs:157:13)
at wrappedValidations.<computed> [as xForwardedForHeader] (file:///app/node_modules/express-rate-limit/dist/index.mjs:369:22)
at Object.keyGenerator (file:///app/node_modules/express-rate-limit/dist/index.mjs:630:20)
at file:///app/node_modules/express-rate-limit/dist/index.mjs:682:32
code: 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR',
help: 'https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/'
}