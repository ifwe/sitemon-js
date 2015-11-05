var Promise = require('bluebird');
var dgram = require('dgram');

function Sitemon(table, hosts) {
    this._table = table;
    this._hosts = Array.isArray(hosts) ? hosts : [hosts];
    this._totalHosts = this._hosts.length;
    this._currentHostIndex = 0;
    this._client = dgram.createSocket("udp4");
}

Sitemon.prototype.send = function(keys, values) {
    return new Promise(function(resolve, reject) {
        var message = formatData(this._table, keys, values);
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

var formatData = function(table, keys, values) {
    var message = ['table=' + table];

    for (var keyColumn in keys) {
        message.push('k.' + keyColumn + '=' + keys[keyColumn]);
    }
    for (var valueColumn in values) {
        message.push('v.' + valueColumn + '=' + values[valueColumn]);
    }

    return message.join('\n');
};

module.exports = Sitemon;
