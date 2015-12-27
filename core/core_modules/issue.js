/**
 * Creates an issue on github for kassy.
 *
 * Written By:
 * 		Dion Woolley
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Dion Woolley and Contributors 2016.
 */

var command = "issue",
    githubAPI = "https://api.github.com/repos/mrkno/Kassy/issues",
    token = 'd58a6df93d4651f69dab0009a8fc62f9926c863a',

    request = require.safe('request'),
    config = require.once('../../config.json'),
    util = require('util'),
    fs = require('fs'),

    submitRequest = function(title, description, debugLevel, callback, waitCallback) {

        waitCallback();

        var data = {title: title},
            debugData = null;

        if (description !== null) {
            data.body = description;
        }
        else {
            data.body = '';
        }
        if (debugLevel === 'full') {
            var cache = [];
            data.body += "\nfull debug details: " + JSON.stringify(this, function (key, value) {
                    if (typeof value === 'object' && value !== null) {
                        if (cache.indexOf(value) !== -1) {
                            // Circular reference found, discard key
                            return;
                        }
                        // Store value in our collection
                        cache.push(value);
                    }
                    return value;
                }, 2);
            cache = null;
        }
        if (debugLevel === 'detail' || debugLevel === 'full') {
            data.body += "\nconfig: ";
            for (var key in config) {
                if (key !== 'output') {
                    data.body += key + ":" + JSON.stringify(config[key], null, 4);
                }
            }
            var stats = fs.statSync('kassy.log');
            if (stats && stats.isFile()) {
                var file = fs.readFileSync('kassy.log', 'utf-8');
                if (file) {
                    var lines = file.trim().split('\n'),
                        log = '\nlog file last 30 lines:\n';
                    for (var i = 29; i >= 0; i--) {
                        if (ifStringNotEmpty(lines[lines.length - i])) {
                            log += "\t" + lines[lines.length - i] + "\n";
                        }
                    }
                    data.body += log;
                }
            }
        }
        if (debugLevel === 'basic' || debugLevel === 'detail') {
            data.body += "\nloaded modules: ";
            for (var i = 0; i < this.loadedModules.length; i++) {
                data.body += this.loadedModules[i].name + ", ";
            }
            data.body += '\nstatus flag: ' + this.statusFlag;
            data.body += '\ncore modules: ';
            for (var i = 0; i < this.coreModules.length; i++) {
                data.body += this.coreModules[i].name + ", ";
            }

            data.body += "\nmodes: ";
            for (var i = 0; i < this.modes.length; i++) {
                data.body += this.modes[i].name + ", ";
            }
        }
        data = JSON.stringify(data);

        request.post({url: githubAPI, headers: {'Authorization' : 'token ' + token, 'content-type' : 'application/json', 'User-Agent' : 'Kassy'}, body: data}, function(error, response, body) {
            body = JSON.parse(body);
            if (response.statusCode === 201 && body && body.html_url) {
                callback({link: body.html_url});
            }
            else {
                console.warn("something went wrong posting issue to github" + JSON.stringify(body));
                callback({error:'Failed to post issue on github, check logs for error'});
            }
        });
    },

    ifStringNotEmpty = str => {
        return str && str.trim(). length !== 0;
    };

exports.match = (text, commandPrefix) => {
    return text.startsWith(commandPrefix + command);
};

exports.run = function(api, event) {
    var input = event.body.split('"'),
        title = null,
        description = null,
        debugLevel = 'basic';

    if (input.length !== 3 && input.length !== 5) {
        var help = '',
            helpMessages = exports.help(api);
        for (var j = 0; j < helpMessages.length; j++) {
            help += '→ ' + helpMessages[j][0] + '\n\t' + helpMessages[j][1] + '\n';
        }
        api.sendMessage("You didn't do that right\n" + help, event.thread_id);
        return;
    }

    if (input.length === 5) {
        title = input[1];
        description = input[3];
        if (ifStringNotEmpty(input[4])) {
            debugLevel = input[4].trim();
        }
    }

    if (input.length === 3) {
        title = input[1];
        if (ifStringNotEmpty(input[2])) {
            debugLevel = input[2].trim();
        }
    }

    submitRequest.call(this, title, description, debugLevel, result => {
        if (result.error) {
            api.sendMessage(result.error, event.thread_id);
            return;
        }

        var link = result.link;
        if (link) {
            api.sendUrl(link, event.thread_id);
        }
        else {
            api.sendMessage("Something went very wrong.", event.thread_id);
        }
    },
    () => {
        api.sendTyping(event.thread_id);
    });
};

exports.help = api => {
  return [[api.commandPrefix + 'issue "<title>" <debugLevel>', "posts an issue to github"],
      [api.commandPrefix + 'issue "<title>" "<description>" <debugLevel>', "posts an issue to github with a description"],
        ['debugLevel can be basic, detail or full', 'defaults to basic if not specified']];
};