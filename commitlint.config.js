export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['web', 'api', 'shared', 'docs', 'infra']],
    'scope-empty': [1, 'never'],
  },
};
