const test_suite = require('abstract-winston-transport');
const Cronos = require('../lib/winston-cronos');
const { createLogger, format, transports } = require('winston');
const assert = require('assert');
describe('winston-cronos', function () {
    const transport = new Cronos({ host: 'lps', port: 3400 });
    
    const log = createLogger({
        format: format.combine(
            format.splat(),
            format.simple()
        ),
        levels: {
            error: 3,
            warn: 4,
            info: 6,
            debug: 7
        },
        transports: [
            transport
        ]
    });

    it('winston-cronos-send', function () {
        log.info({a:1, b:'test send'})
    });
});
