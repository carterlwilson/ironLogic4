// Schemas have been moved to separate files:
// - auth.ts - Authentication related schemas (LoginSchema, RegisterSchema)
// - users.ts - User related schemas (UserSchema, CreateUserSchema, UserTypeSchema)
// - gyms.ts - Gym related schemas (GymSchema, CreateGymSchema)
// - clients.ts - Client related schemas (ClientListParamsSchema, CreateClientSchema, UpdateClientSchema)
// - api.ts - API related schemas (ApiResponseSchema)
//
// Import directly from the specific schema files instead of this index

export * from './clients';
export * from './coaches';