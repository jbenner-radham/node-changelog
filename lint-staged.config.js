/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{js,ts,json,md}': 'eslint --fix',
  'package.json': 'sort-package-json'
};
