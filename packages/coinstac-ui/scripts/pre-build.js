const fs = require('fs');

if (process.env.NODE_ENV === 'development') {
  fs.copyFileSync('./config/local-development.json', './config/local.json');
} else if (process.env.NODE_ENV === 'production') {
  fs.copyFileSync('./config/local-production.json', './config/local.json');
}
