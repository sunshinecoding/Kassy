var Client = require('node-xmpp-client'),
	client = null,
	shim = require('../shim.js'),
	packageInfo = require('../../package.json'),
	keepAliveTimeout,
	api;

exports.sendMessage = function(message, thread) {
	var t = thread.split('|'),
		stanza = new Client.Stanza('message', {to: t[0], type: t[1]}).c('body').t(message);
	client.send(stanza);
};

exports.sendUrl = function(url, thread) {
	exports.sendMessage(url, thread);
};

exports.sendImage = function(type, image, description, thread) {
	switch (type) {
		case 'url':
			exports.sendUrl(description, thread);
			exports.sendMessage(image, thread);
			break;
		case 'file':
			exports.sendMessage("I want to send a file to you but cant on this platform...");
			break;
	}
};

exports.sendFile = function(type, file, description, thread) {
	switch (type) {
		case 'url':
			exports.sendUrl(description);
			exports.sendMessage(file, thread);
			break;
		case 'file':
			exports.sendMessage("I want to send a file to you but cant on this platform...");
			break;
	}
};

exports.start = function(callback) {
	client = new Client({
		jid: exports.config.hipchat_id + '/bot',
		password: exports.config.password
	});

	api = shim.createPlatformModule(exports);
	
	client.on('online', function() {
		var onlineStatusUpdate = new Client.Stanza('presence', {type: 'available'})
			.c('show').t('chat');
		client.send(onlineStatusUpdate);
		
		var rooms = exports.config.rooms;
		for (var i = 0; i < rooms.length; i++) {
			var joinRoom = new Client.Stanza('presence', {to: rooms[i] + '/Matthew Knox'})
				.c('x', {xmlns: 'http://jabber.org/protocol/muc'}); 
			client.send(joinRoom);
		}
		
		// keep alive
		var keepAliveFunc = function() {
			client.send(' ');
			keepAliveTimeout = setInterval(keepAliveFunc, 30000);
		};
		keepAliveTimeout = setInterval(keepAliveFunc, 30000);
	});
	
	client.on('stanza', function(stanza) {
		if (stanza.attrs.type === 'error') {
			console.log('Hipchat returned an error:');
			console.log(JSON.stringify(stanza, null, 2));
			return;
		}

		if (stanza.is('message') && stanza.attrs.type.endsWith('chat')) {
			var body = stanza.getChildText('body'),
				senderId = stanza.attrs.from,
				senderName = senderId.substring(senderId.indexOf('/') + 1),
				threadId = senderId + '|' + stanza.attrs.type;

			if (body == null) return;
				
			var event = shim.createEvent(threadId, senderId, senderName, body);
			callback(api, event);
		}
	});
};

exports.stop = function() {
	clearInterval(keepAliveTimeout);
	client.end();
	client = null;
};
