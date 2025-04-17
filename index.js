// Re-export components for better module resolution with GitHub installs
'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/index.cjs.js');
} else {
  module.exports = require('./dist/index.cjs.js');
} 