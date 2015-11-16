var HipChatter = require('hipchatter'),
  hipchatter = null,
  webhook = null;

exports.sendMessage = function(message, thread) {
  var notifyConfig = {
    message: message,
    color: exports.config.hipchat_color ? exports.config.hipchat_color : 'green',
    token: exports.config.hipchat_auth_token
  };

  hipchatter.notify(exports.config.hipchat_room, notifyConfig, function(err){
      if (err) {
        throw 'Failed to send message to room.';
      }
  });
};

exports.sendUrl = function(url, thread) {
  exports.sendMessage('<a href="' + url + '">' + url + '</a>', thread);
};

exports.sendImage = function(type, image, description, thread) {
};

exports.sendFile = function(type, file, description, thread) {
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
    pattern: '*',
    event: 'room_message',
    name: 'kassy_webhook'
  };

  hipchatter.create_webhook(exports.config.hipchat_room, hookConfig, function(err, wh){
    if (err) {
      throw 'Failed to create webhook.';
    }
    webhook = wh;
  });
};

exports.stop = function() {
  hipchatter.delete_webhook(exports.config.hipchat_room, webhook.id, function(err) {
    if (err) {
      throw 'Could not delete the webhook.';
    }
    webhook = null;
  });
};
