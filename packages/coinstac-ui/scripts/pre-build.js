const fs = require('fs');

console.log('AA', process.env.NODE_ENV);

if (process.env.NODE_ENV === 'development') {
  fs.copyFileSync('./config/local-development.json', './config/local.json');
} else if (process.env.NODE_ENV === 'production') {
  fs.copyFileSync('./config/local-production.json', './config/local.json');
}
