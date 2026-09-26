export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      ['client', 'server', 'shared', 'content', 'ci', 'docs', 'deps', 'infra', 'quests', 'release'],
    ],
  },
}
