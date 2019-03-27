const os = require('os');

const TransportStream = require('winston-transport');
const { Socket } = require('net');
const moment = require('moment');

module.exports = class CronosLogger extends TransportStream {
    constructor(opts) {

        const socketParams = {
            'host': opts.host,
            'port': opts.port,
        }

        const socket = Socket();
        let client = socket.connect(socketParams);
        client.on('close', function () {
            client = socket.connect(socketParams);
        });

        // client.on('connect', function () {
        //     //console.log('Socket Cronos Logger DLL connected...', opts);
        // });
        client.on('data', (data) => {
            if (data == 'disconnect') {
                client.end();
            }
        });

        super(opts);
        this.opts = opts
        this.client = client;
    }

    log({ level, message }, callback) {
        const { ip, username, path, script } = this.opts;
        const time = moment();

        if (!callback) {
            callback = () => { };
        }

        const buff = JSON.stringify({
            path,
            info: level,
            text: JSON.stringify(message),
            script: script || "",
            username: username || "",
            ip: ip || os.hostname(),
            date: time.format("DD.MM.YYYY"),
            time: time.format("HH:mm"),
            sec: time.format("s.SSS")
        });

        const length = buff.length + '';
        const msg = `${length.padEnd(10)}${buff}`
        this.client.write(msg, (err, length) => {
            console.log(msg, length)
            this.emit('logged', msg);
            callback();
        });

    }
};