var Promise = require('bluebird');
var dgram = require('dgram');

function Sitemon(type, hosts) {
    this._type = type;
    this._hosts = Array.isArray(hosts) ? hosts : [hosts];
    this._totalHosts = this._hosts.length;
    this._currentHostIndex = 0;
    this._client = dgram.createSocket("udp4");
}

Sitemon.prototype.send = function(data) {
    return new Promise(function(resolve, reject) {
        var message = formatData(this._type, data);
        var buf = new Buffer(message);

        var selectedHost = this._hosts[this._currentHostIndex].split(':', 2);
        var host = selectedHost[0];
        var port = parseInt(selectedHost[1]);

        this._client.send(buf, 0, buf.length, port, host, function(err) {
            if (err) {
                return reject(err);
            }

            resolve(true);
        });

        this._currentHostIndex++;
        this._currentHostIndex %= this._totalHosts;
    }.bind(this));
};

var formatData = function(type, data) {
    var message = ['type=' + type];

    for (var key in data) {
        message.push(key + '=' + data[key]);
    }

    return message.join('\n');
};

module.exports = Sitemon;