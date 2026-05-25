module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*.test.(ts|tsx|js)'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  transform: {
    '^.+\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        transform: {
          react: {
            runtime: 'automatic'
          }
        }
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
