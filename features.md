Stay in plan mode.

I'm trying to run the same build commands that railway uses, and I'm seeing the following
errors. Why?

src/controllers/auth.ts:2:45 - error TS2307: Cannot find module '@ironlogic4/shared/schemas/auth' or its corresponding type declarations.
There are types at '/Users/carterwilson/Repos/ironLogic4/node_modules/@ironlogic4/shared/dist/schemas/auth.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.

2 import { RegisterSchema, LoginSchema } from '@ironlogic4/shared/schemas/auth';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/controllers/auth.ts:3:29 - error TS2307: Cannot find module '@ironlogic4/shared/types/api' or its corresponding type declarations.
There are types at '/Users/carterwilson/Repos/ironLogic4/node_modules/@ironlogic4/shared/dist/types/api.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.

3 import { ApiResponse } from '@ironlogic4/shared/types/api';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/controllers/auth.ts:20:52 - error TS7006: Parameter 'e' implicitly has an 'any' type.

20         message: validationResult.error.errors.map(e => e.message).join(', ')
~

src/controllers/auth.ts:96:52 - error TS7006: Parameter 'e' implicitly has an 'any' type.

96         message: validationResult.error.errors.map(e => e.message).join(', ')
~

src/controllers/gyms.ts:5:33 - error TS2307: Cannot find module '@ironlogic4/shared/schemas/gyms' or its corresponding type declarations.
There are types at '/Users/carterwilson/Repos/ironLogic4/node_modules/@ironlogic4/shared/dist/schemas/gyms.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.

5 import { CreateGymSchema } from '@ironlogic4/shared/schemas/gyms';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/controllers/gyms.ts:6:48 - error TS2307: Cannot find module '@ironlogic4/shared/types/api' or its corresponding type declarations.
There are types at '/Users/carterwilson/Repos/ironLogic4/node_modules/@ironlogic4/shared/dist/types/api.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.

6 import { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/controllers/gyms.ts:130:52 - error TS7006: Parameter 'e' implicitly has an 'any' type.

130         message: validationResult.error.errors.map(e => e.message).join(', '),
~

src/controllers/scheduleTemplates.ts:222:75 - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
Type 'undefined' is not assignable to type 'string'.

222     const coachValidation = await validateCoachIds(templateData.coachIds, gymId);
~~~~~

src/controllers/users.ts:4:34 - error TS2307: Cannot find module '@ironlogic4/shared/schemas/users' or its corresponding type declarations.
There are types at '/Users/carterwilson/Repos/ironLogic4/node_modules/@ironlogic4/shared/dist/schemas/users.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.

4 import { CreateUserSchema } from '@ironlogic4/shared/schemas/users';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/controllers/users.ts:5:48 - error TS2307: Cannot find module '@ironlogic4/shared/types/api' or its corresponding type declarations.
There are types at '/Users/carterwilson/Repos/ironLogic4/node_modules/@ironlogic4/shared/dist/types/api.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.

5 import { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/controllers/users.ts:6:26 - error TS2307: Cannot find module '@ironlogic4/shared/types/users' or its corresponding type declarations.
There are types at '/Users/carterwilson/Repos/ironLogic4/node_modules/@ironlogic4/shared/dist/types/users.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.

6 import { UserType } from '@ironlogic4/shared/types/users';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/controllers/users.ts:135:52 - error TS7006: Parameter 'e' implicitly has an 'any' type.

135         message: validationResult.error.errors.map(e => e.message).join(', '),
~

src/middleware/auth.ts:3:24 - error TS2307: Cannot find module '@ironlogic4/shared/types/users' or its corresponding type declarations.
There are types at '/Users/carterwilson/Repos/ironLogic4/node_modules/@ironlogic4/shared/dist/types/users.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.

3 import {UserType} from '@ironlogic4/shared/types/users';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/models/Gym.ts:2:29 - error TS2307: Cannot find module '@ironlogic4/shared/types/gyms' or its corresponding type declarations.
There are types at '/Users/carterwilson/Repos/ironLogic4/node_modules/@ironlogic4/shared/dist/types/gyms.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.

2 import { Gym as IGym } from '@ironlogic4/shared/types/gyms';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/models/User.ts:2:41 - error TS2307: Cannot find module '@ironlogic4/shared/types/users' or its corresponding type declarations.
There are types at '/Users/carterwilson/Repos/ironLogic4/node_modules/@ironlogic4/shared/dist/types/users.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.

2 import { User as IUser, UserType } from '@ironlogic4/shared/types/users';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/scripts/addClients.ts:4:26 - error TS2307: Cannot find module '@ironlogic4/shared/types/users' or its corresponding type declarations.
There are types at '/Users/carterwilson/Repos/ironLogic4/node_modules/@ironlogic4/shared/dist/types/users.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.

4 import { UserType } from '@ironlogic4/shared/types/users';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~