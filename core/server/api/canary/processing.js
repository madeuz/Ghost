const Promise = require('bluebird');
const common = require('../../lib/common');

module.exports = {
    init() {
        return Promise.resolve((req, res, next) => {
            res.send(req.processUUID);
        });
    },

    read(frame) {
        const object = frame.data;

        if (!object || !object.id) {
            return Promise.reject(new common.errors.NotFoundError());
        }

        return Promise.resolve((req, res, next) => {
            const sessionData = req.session.processing[object.id];
            if (!sessionData) {
                res.status(404).send('Not found');
            }
            res.send(JSON.stringify(sessionData));
        });
    },

    destroy(frame) {
        const object = frame.data;

        if (!object || !object.id) {
            return Promise.reject(new common.errors.NotFoundError());
        }

        return Promise.resolve((req, res, next) => {
            const sessionData = req.session.processing[object.id];
            if (!sessionData) {
                res.status(404).send('Not found');
            }
            if (sessionData.command) {
                sessionData.command.kill();
            }
            req.session.processing[object.id] = undefined;
            res.send('OK');
        });
    }
};
