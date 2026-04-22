/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/src/js/__tests__/smoke.test.js'],
    moduleFileExtensions: ['js', 'mjs', 'cjs', 'json'],
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    transformIgnorePatterns: ['/node_modules/(?!(isomorphic-fetch)/)']
};
