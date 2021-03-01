/* eslint-disable no-console */
const WS = require('ws');

const ws = new WS('ws://1001a6db25bc7e962f5ed775d32e891969b79d5fa319c200d48fb9fe04662711:8101');
ws.on('open', () => {
  console.log('connectedddddd');
});
ws.on('error', (e) => {
  console.log(e);
});
