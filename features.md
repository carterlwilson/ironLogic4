Go into plan mode. 

We're going in circles here, I'm seeing the following build logs and errors again
on Railway but not locally: 

stage-0
RUN npm install && npm run build -w @ironlogic4/shared && npm run build -w @ironlogic4/server
18s
npm warn config production Use `--omit=dev` instead.
up to date, audited 934 packages in 7s
188 packages are looking for funding
run `npm fund` for details
2 moderate severity vulnerabilities
To address all issues, run:
npm audit fix
Run `npm audit` for details.
npm warn config production Use `--omit=dev` instead.
> @ironlogic4/shared@1.0.0 build
> tsc
npm warn config production Use `--omit=dev` instead.
> @ironlogic4/server@1.0.0 build
> tsc
src/controllers/auth.ts(2,45): error TS2307: Cannot find module '@ironlogic4/shared/schemas/auth' or its corresponding type declarations.

There are types at '/app/node_modules/@ironlogic4/shared/dist/schemas/auth.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.
src/controllers/auth.ts(3,29): error TS2307: Cannot find module '@ironlogic4/shared/types/api' or its corresponding type declarations.

There are types at '/app/node_modules/@ironlogic4/shared/dist/types/api.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.
src/controllers/auth.ts(20,52): error TS7006: Parameter 'e' implicitly has an 'any' type.

src/controllers/auth.ts(96,52): error TS7006: Parameter 'e' implicitly has an 'any' type.

src/controllers/gyms.ts(5,33): error TS2307: Cannot find module '@ironlogic4/shared/schemas/gyms' or its corresponding type declarations.

There are types at '/app/node_modules/@ironlogic4/shared/dist/schemas/gyms.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.
src/controllers/gyms.ts(6,48): error TS2307: Cannot find module '@ironlogic4/shared/types/api' or its corresponding type declarations.

There are types at '/app/node_modules/@ironlogic4/shared/dist/types/api.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.
src/controllers/gyms.ts(130,52): error TS7006: Parameter 'e' implicitly has an 'any' type.

src/controllers/scheduleTemplates.ts(222,75): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.

Type 'undefined' is not assignable to type 'string'.
src/controllers/users.ts(4,34): error TS2307: Cannot find module '@ironlogic4/shared/schemas/users' or its corresponding type declarations.

There are types at '/app/node_modules/@ironlogic4/shared/dist/schemas/users.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.
src/controllers/users.ts(5,48): error TS2307: Cannot find module '@ironlogic4/shared/types/api' or its corresponding type declarations.

There are types at '/app/node_modules/@ironlogic4/shared/dist/types/api.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.
src/controllers/users.ts(6,26): error TS2307: Cannot find module '@ironlogic4/shared/types/users' or its corresponding type declarations.

There are types at '/app/node_modules/@ironlogic4/shared/dist/types/users.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.
src/controllers/users.ts(135,52): error TS7006: Parameter 'e' implicitly has an 'any' type.

src/middleware/auth.ts(3,24): error TS2307: Cannot find module '@ironlogic4/shared/types/users' or its corresponding type declarations.

There are types at '/app/node_modules/@ironlogic4/shared/dist/types/users.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.
src/models/Gym.ts(2,29): error TS2307: Cannot find module '@ironlogic4/shared/types/gyms' or its corresponding type declarations.

There are types at '/app/node_modules/@ironlogic4/shared/dist/types/gyms.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.
src/models/User.ts(2,41): error TS2307: Cannot find module '@ironlogic4/shared/types/users' or its corresponding type declarations.

There are types at '/app/node_modules/@ironlogic4/shared/dist/types/users.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.
src/scripts/addClients.ts(4,26): error TS2307: Cannot find module '@ironlogic4/shared/types/users' or its corresponding type declarations.

There are types at '/app/node_modules/@ironlogic4/shared/dist/types/users.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.
npm error Lifecycle script `build` failed with error:

npm error code 2
npm error path /app/packages/server
npm error workspace @ironlogic4/server@1.0.0
npm error location /app/packages/server
npm error command failed
npm error command sh -c tsc
Dockerfile:24
-------------------
22 |     # build phase
23 |     COPY . /app/.
24 | >>> RUN --mount=type=cache,id=s/2e9766f0-4da0-45f2-aecb-6776a0b36e32-node_modules/cache,target=/app/node_modules/.cache npm install && npm run build -w @ironlogic4/shared && npm run build -w @ironlogic4/server
25 |
\
26 |
-------------------
ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c npm install && npm run build -w @ironlogic4/shared && npm run build -w @ironlogic4/server" did not complete successfully: exit code: 2
Error: Docker build failed