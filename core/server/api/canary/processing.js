const Promise = require('bluebird');
const common = require('../../lib/common');

module.exports = {
    init() {
        return Promise.resolve((req, res, next) => {
            res.send(JSON.stringify({pid: [{url: req.processUUID}]}));
        });
    },

    read(frame) {
        const object = frame.original.params;

        if (!object || !object.id) {
            return Promise.reject(new common.errors.NotFoundError());
        }

        return Promise.resolve((req, res) => {
            const sessionData = req.session.processing[object.id];
            if (!sessionData) {
                res.status(404).send('Not found');
            }
            res.send(JSON.stringify(sessionData));
        });
    },

    destroy(frame) {
        const object = frame.original.params;

        if (!object || !object.id) {
            return Promise.reject(new common.errors.NotFoundError());
        }

        return Promise.resolve((req, res) => {
            const sessionData = req.session.processing[object.id];
            if (!sessionData) {
                res.status(404).send('Not found');
            }
            req.session.processing[object.id] = undefined;
            res.send(JSON.stringify({response: 'OK'}));
        });
    }
};
