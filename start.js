require('babel-polyfill');
require('babel-register')({
  "presets": ["es2015", "stage-2"]
});

require('./index_2.js');