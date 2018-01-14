var socket = require('socket.io-client')('http://localhost:3000?shit=poop');
socket.on('news', function (data) {
	console.log(data);
	socket.emit('my other event', { my: 'data' });
});

socket.on('connect_error', (shit) => {
	console.log(shit);
});
socket.on('connect_timeout', (shit) => {
	console.log(shit);
});

setTimeout(() => {
	socket.disconnect();
}, 1000);
setTimeout(() => {
	socket.connect();
}, 2000);
