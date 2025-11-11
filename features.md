Stay in plan mode.

Now locally when I try to send a password reset email, I'm seeing the following error:
[EMAIL ERROR] Failed to send password reset email: ResponseError: Unauthorized
at /Users/carterwilson/Repos/ironLogic4/node_modules/@sendgrid/client/src/classes/client.js:167:29
at process.processTicksAndRejections (node:internal/process/task_queues:95:5) {
code: 401,
response: {
headers: Object [AxiosHeaders] {
server: 'nginx',
date: 'Tue, 11 Nov 2025 02:07:40 GMT',
'content-type': 'application/json',
'content-length': '116',
connection: 'keep-alive',
'access-control-allow-origin': 'https://sendgrid.api-docs.io',
'access-control-allow-methods': 'POST',
'access-control-allow-headers': 'Authorization, Content-Type, On-behalf-of, x-sg-elas-acl',
'access-control-max-age': '600',
'x-no-cors-reason': 'https://sendgrid.com/docs/Classroom/Basics/API/cors.html',
'strict-transport-security': 'max-age=31536000; includeSubDomains',
'content-security-policy': "frame-ancestors 'none'",
'cache-control': 'no-cache',
'x-content-type-options': 'no-sniff',
'referrer-policy': 'strict-origin-when-cross-origin'
},
body: { errors: [Array] }
}
}
[EMAIL ERROR] SendGrid response: {
errors: [
{
message: 'The provided authorization grant is invalid, expired, or revoked',
field: null,
help: null
}
]
}
[PASSWORD RESET] Failed to send email: Error: Failed to send password reset email
at sendPasswordResetEmail (/Users/carterwilson/Repos/ironLogic4/packages/server/src/utils/emailService.ts:104:11)
at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
at forgotPassword (/Users/carterwilson/Repos/ironLogic4/packages/server/src/controllers/passwordReset.ts:65:7)