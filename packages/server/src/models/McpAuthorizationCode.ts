import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  clientId: { type: String, required: true },
  redirectUri: { type: String, required: true },
  challenge: { type: String, required: true },
  resource: { type: String, required: true },
  scope: { type: String, default: 'scheduling' },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const McpAuthorizationCode = mongoose.model('McpAuthorizationCode', schema);
