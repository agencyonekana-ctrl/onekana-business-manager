export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-unknown': [true, { ignoreAtRules: ['tailwind', 'apply', 'layer', 'screen'] }],
    'custom-property-pattern': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'no-descending-specificity': null,
    'selector-class-pattern': null,
  },
}
