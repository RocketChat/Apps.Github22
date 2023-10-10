module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
     '@typescript-eslint',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        "no-case-declarations": "off",
        "@typescript-eslint/no-unused-vars": ["error", { "vars": "all", "args": "after-used", "ignoreRestSiblings": false }],
        '@typescript-eslint/no-floating-promises': ['error'],
    },
};