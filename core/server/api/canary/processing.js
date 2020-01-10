const Promise = require('bluebird');
const common = require('../../lib/common');
const models = require('../../models');

module.exports = {
    init() {
        return Promise.resolve((req, res) => {
            if (req.processUUID) {
                res.send(JSON.stringify({pid: [{url: req.processUUID}]}));
            } else {
                res.sendStatus(500);
            }
        });
    },

    read(frame) {
        const object = frame.original.params;

        if (!object || !object.id) {
            return Promise.reject(new common.errors.NotFoundError());
        }

        return models.Processing.findOne({uuid: object.id});
    },

    destroy(frame) {
        const object = frame.original.params;

        if (!object || !object.id) {
            return Promise.reject(new common.errors.NotFoundError());
        }

        return models.Processing.destroy({uuid: object.id});
    }
};
