module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: [
        'eslint:recommended',
        'plugin:jest/recommended',
        'prettier'
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    plugins: [
        'jest'
    ],
    rules: {
        // Error prevention
        'no-var': 'error',
        'prefer-const': 'error',
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        
        // Best practices
        'eqeqeq': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-return-await': 'error',
        'require-await': 'error',
        'no-throw-literal': 'error',
        
        // Code style
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'never'],
        'arrow-parens': ['error', 'always'],
        'arrow-spacing': 'error',
        'no-multiple-empty-lines': ['error', { 'max': 1 }],
        'no-trailing-spaces': 'error',
        'eol-last': 'error',
        
        // Object and array
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        'object-shorthand': 'error',
        
        // Import/Export
        'import/no-duplicates': 'error',
        'import/order': ['error', {
            'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
            'newlines-between': 'always',
            'alphabetize': { 'order': 'asc' }
        }],
        
        // Jest
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error'
    },
    settings: {
        jest: {
            version: 29
        }
    }
}; 