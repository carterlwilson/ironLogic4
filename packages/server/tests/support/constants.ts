export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ironlogic4';

export const TEST_CLIENT_EMAIL = 'test-integration-client@ironlogic4.test';
export const TEST_CLIENT_PASSWORD = 'TestPassword123!';
export const TEST_GYM_NAME = 'TEST_IntegrationSuite_Gym';

export const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
