import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: String, required: true },
  clientId: { type: String, required: true },
  resource: { type: String, required: true },
  scope: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  revokedAt: { type: Date, default: null },
});

export const McpConnection = mongoose.model('McpConnection', schema);
