const os = require('os');

const TransportStream = require('winston-transport');
const { Socket } = require('net');
const moment = require('moment');

const socketParams = {
    'host': 'lps',
    'port': 3400,
};
const socket = Socket();

let client = socket.connect(socketParams);
// client.on('close', function () {

// });

client.on('data', (data) => {
    if (data == 'disconnect') {
        client.end();
        client = socket.connect(socketParams);
    }
});
client.on('error', (data) => {
    console.log(data);
    client.end()
});

module.exports = class CronosLogger extends TransportStream {
    constructor(opts) {
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
        const msg = `${length.padEnd(10)}${buff}`
        console.log(msg);
        client.write(msg, (err, length) => {
            this.emit('logged', msg);
            callback();
        });
    }
};