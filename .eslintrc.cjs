/* Minimal ESLint: works without optional plugins */
module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true,
        node: true
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
    },
    rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
        'no-console': 'off'
    },
    ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
    overrides: [
        {
            files: ['**/__tests__/**/*.js', '**/*.test.js'],
            env: { jest: true },
            rules: { 'no-undef': 'off' }
        }
    ]
};
