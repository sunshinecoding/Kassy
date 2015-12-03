var Client = require('node-xmpp-client'),
	client = null,
	shim = require('../shim.js'),
	packageInfo = require('../../package.json');

exports.sendMessage = function(message, thread) {
	var stanza = new Client.Stanza('message', {to: thread, type: 'chat'}).c('body').t(message);
	client.send(stanza);
};

exports.sendUrl = function(url, thread) {
  exports.sendMessage('<a href="' + url + '">' + url + '</a>', thread);
};

exports.sendImage = function(type, image, description, thread) {
  switch (type) {
    case 'url':
      exports.sendMessage('<p>' + description + '</p><img src="' + url + '" alt="' + description + '">' + description + '</img>', thread);
      break;
    case 'file':
      exports.sendMessage("I want to send a file to you but cant on this platform...");
      break;
  }
};

exports.sendFile = function(type, file, description, thread) {
  switch (type) {
    case 'url':
      exports.sendMessage('<p>' + description + '</p><a href="' + url + '" alt="' + description + '">' + description + '</a>', thread);
      break;
    case 'file':
      exports.sendMessage("I want to send a file to you but cant on this platform...");
      break;
  }
};

exports.start = function(callback) {
	client = new Client({
		jid: exports.config.hipchat_id,
		password: exports.config.password
	});

	client.on('stanza', function(stanza) {
		if (stanza.is('message') && stanza.attrs.type === 'chat') {
			var body = stanza.getChildText('body'),
				threadId = exports.config.hipchat_id,
				senderId = stanza.attrs.from,
				senderName = senderId;

			var event = shim.createEvent(threadId, senderId, senderName, body);
			callback(api, event);
		}
	});
};

exports.stop = function() {
  client.end();
  client = null;
};
