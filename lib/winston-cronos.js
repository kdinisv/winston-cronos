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
socket.setEncoding('utf-8')
let client = socket.connect(socketParams);

client.on('connect', function () {
    dinfo('connect', socketParams)
});

client.on('data', (data) => {
    if (data == 'disconnect\r\n') {
        dinfo('disconnected by timeout');
    }
});

// other side sends FIN packet
let FIN_SENDED = false;
client.on('end', () => {
    FIN_SENDED = true;
});

client.on('close', () => {
    dinfo('Close connection')
    if (FIN_SENDED) {
        dinfo('reconnect', socketParams)
        client.connect(socketParams);
        FIN_SENDED = false;
    }
});

client.on('error', (data) => {
    derror('ERROR', data);
});

module.exports = class CronosLogger extends TransportStream {
    constructor(opts) {
        dinfo('init', opts)
        dinfo('server.address', client.address())
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
            //dinfo(msg)
            this.emit('logged', msg);
            callback();
        });
    }
};