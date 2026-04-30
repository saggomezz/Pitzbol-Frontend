/** @type {import('@stryker-mutator/api/core').Config} */
module.exports = {
  mutator: 'typescript',
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    config: require('./jest.config.cjs')
  },
  mutate: [
    'lib/**/*.ts',
    'lib/**/*.tsx',
    'app/**/*.ts',
    'app/**/*.tsx',
    '!**/*.d.ts',
    '!app/**/pages/**',
    '!public/**',
    '!node_modules/**'
  ],
  tsconfigFile: 'tsconfig.json',
  timeoutMS: 60000,
  coverageAnalysis: 'off',
  thresholds: { high: 90, low: 75, break: 70 },
  concurrency: 2
};
