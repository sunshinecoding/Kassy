exports.help = function() {
	return [[this.commandPrefix + 'associate "<hook>" "<text>" or clear','Associate and disassociate a phrase with another.']];
};

exports.match = function(text, commandPrefix, thread, senderName, api) {
	if (text.startsWith(commandPrefix + 'associate')) {
		return true;
	}

	var s = text.toLowerCase();
	for (var assoc in this.config[thread]) {
		if (s.indexOf(assoc.toLowerCase()) !== -1) {
			if (api) {
				api.sendMessage(this.config[thread][assoc], thread);
			}
			return true;
		}
	}
	return false;
};

exports.toggleAssociation = function(thread, hook, text) {
	hook = hook.toLowerCase();
	if (this.config[thread] && this.config[thread][hook] && !text) {
		delete this.config[thread][hook];
		return false;
	}

	if (!this.config[thread]) {
		this.config[thread] = {};
	}
	this.config[thread][hook] = text;
	return true;
};

exports.printAssociations = function(api, event) {
	var assoc = this.config[event.thread_id];
	var message = '';
	for (var a in assoc) {
		message += a + ' → ' + assoc[a] + '\n';
	}
	message.trim();
	api.sendMessage(message, event.thread_id);
};

exports.clear = function(api, event) {
	this.config[event.thread_id] = {};
	api.sendMessage('Associations cleared.', event.thread_id);
};

exports.run = function(api, event) {
	if (!event.body.startsWith(api.commandPrefix + 'associate')) {
		return exports.match(event.body, api.commandPrefix, event.thread_id, null, api);
	}

	if (event.body === api.commandPrefix + 'associate') {
		return exports.printAssociations(api, event);
	}

	if (event.body === api.commandPrefix + 'associate clear') {
		return exports.clear(api, event);
	}

	var spl = event.body.split('"');
	if (spl.length !== 3 && spl.length !== 5)  {
		api.sendMessage('WTF are you doing????!', event.thread_id);
		return;
	}

	exports.toggleAssociation(event.thread_id, spl[1], spl[3]);
	api.sendMessage('Association changed.', event.thread_id);
};
