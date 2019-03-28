const os = require('os');

const TransportStream = require('winston-transport');
const { Socket } = require('net');
const moment = require('moment');
const debug = require('debug'),
    dinfo = debug('winston-cronos'),
    derror = debug('winston-cronos:error');

const socketParams = {
    'host': 'lps',
    'port': 3400,
};
const socket = Socket();

let client = socket.connect(socketParams);
client.on('close', function () {
    dinfo('close')
});

client.on('data', (data) => {
    dinfo('data', data)
    if (data == 'disconnect') {
        client.end();
        client = socket.connect(socketParams);
    }
});
client.on('error', (data) => {
    derror(data);
    client.end()
});

module.exports = class CronosLogger extends TransportStream {
    constructor(opts) {
        dinfo('init', opts)
        super(opts);
        this.opts = opts
    }

    log({ level, message }, callback) {
        const { ip, username, path, script } = this.opts;
        const time = moment();

        if (!callback) {
            callback = () => { };
        }

        const buff = Buffer.from(JSON.stringify({
            encoding: 'utf8',
            path,
            info: level,
            text: JSON.stringify(message),
            script: script || "",
            username: username || "",
            ip: ip || os.hostname(),
            date: time.format("DD.MM.YYYY"),
            time: time.format("HH:mm"),
            sec: time.format("s.SSS")
        }));

        const length = buff.length + '';
        const msg = `${length.padEnd(10)}${buff}`;
        client.write(msg, () => {
            dinfo(msg)
            this.emit('logged', msg);
            callback();
        });
    }
};