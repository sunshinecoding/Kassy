var HipChatter = require('hipchatter'),
  hipchatter = null,
  webhook = null,
  express = require('express'),
  app = null,
  server = null,
	shim = require("../shim.js"),
  platform = null,
	bodyParser  = require("body-parser");

exports.sendMessage = function(message, thread) {
  var notifyConfig = {
    message: message,
    color: exports.config.hipchat_color ? exports.config.hipchat_color : 'green',
    token: exports.config.hipchat_auth_token
  };

  hipchatter.notify(thread, notifyConfig, function(err){
      if (err) {
        console.error(err);
        throw 'Failed to send message to room.';
      }
  });
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

exports.setTitle = function(title, thread) {
  hipchatter.set_topic(thread, title, function (err) {
    if (err) {
      exports.sendMessage('Something went wrong setting the title of the chat...', thread);
      console.error(err);
    }
  });
};

exports.start = function(callback) {
  hipchatter = new HipChatter(exports.config.hipchat_auth_token);
  var hookConfig = {
    url: exports.config.hipchat_server_url,
    pattern: '.*',
    event: 'room_message',
    name: 'kassy_webhook'
  };

  platform = shim.createPlatformModule(exports);

  app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.post('/', function (req, res) {
    var data = req.body,
      room = data.item.room.id,
      sender = data.item.message.from.id,
      senderName = data.message.from.name,
      type = data.item.message.type,
      messg = data.item.message.message;

      if (type == "message") {
        var event = shim.createEvent(room, sender, senderName, messg);
        callback(platform, event);
      }
  });
  server = app.listen(this.config.port);

  hipchatter.create_webhook(exports.config.hipchat_room, hookConfig, function(err, wh){
    if (err) {
      console.error(err);
      throw 'Failed to create webhook.';
    }
    webhook = wh;
  });
};

exports.stop = function() {
  hipchatter.delete_webhook(exports.config.hipchat_room, webhook.id, function(err) {
    if (err) {
      console.error(err);
      throw 'Could not delete the webhook.';
    }
    webhook = null;
    server.close();
    server = null;
    app = null;
    platform = null;
  });
};
