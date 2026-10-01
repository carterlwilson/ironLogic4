import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  connectionId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  consumedAt: { type: Date, default: null },
});

export const McpRefreshToken = mongoose.model('McpRefreshToken', schema);
