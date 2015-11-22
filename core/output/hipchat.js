var HipChatter = require('hipchatter'),
  hipchatter = null,
  webhook = null,
  express = require('express'),
  app = null,
  server = null,
	shim = require("../shim.js"),
  platform = null,
	bodyParser  = require("body-parser"),
  wobot = require('wobot'),
  bot = null,
  packageInfo = require('../../package.json');

exports.sendMessage = function(message, thread) {
  bot.message(thread, message);
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
  bot = new wobot.Bot({
    jid: exports.config.hipchat_jid + '/bot',
    password: exports.config.password,
    caps_ver: packageInfo.name.toProperCase()
  });

  platform = shim.createPlatformModule(exports);

  bot.onMessage('.*', function(room, from, message) {
    var event = shim.createEvent(room, from, from, message);
    callback(platform, event);
  });

  bot.connect();
};

exports.stop = function() {
  bot.disconnect();
  bot = null;
};
