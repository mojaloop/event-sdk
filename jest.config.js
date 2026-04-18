module.exports = {
  displayName: 'tsc',
  testMatch: [
    '**/test/unit/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // other options
        diagnostics: {
          ignoreCodes: [151002],
        },
      },
    ]
  },
  transformIgnorePatterns: [
    '^.+\\.json$',
    'jest.config.js'
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  verbose: true,
  openHandlesTimeout: 3000,
  coverageThreshold: {
    global: {
      statements: 90,
      functions: 90,
      branches: 90,
      lines: 90
    }
  },
  coveragePathIgnorePatterns: [
    "src/index.ts"
  ],
}
