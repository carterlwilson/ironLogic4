/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  roots: ['<rootDir>/tests'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  globalSetup: '<rootDir>/tests/support/globalSetup.cjs',
  globalTeardown: '<rootDir>/tests/support/globalTeardown.cjs',
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
};
