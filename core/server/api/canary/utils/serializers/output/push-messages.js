const debug = require('ghost-ignition').debug('api:canary:utils:serializers:output:pushMessages');
const mapper = require('./utils/mapper');

module.exports = {
    all(models, apiConfig, frame) {
        debug('all');

        if (!models) {
            return;
        }

        if (models.meta) {
            frame.response = {
                pushMessages: models.data.map(model => mapper.mapPushMessage(model, frame)),
                meta: models.meta
            };

            return;
        }

        frame.response = {
            pushMessages: [mapper.mapPushMessage(models, frame)]
        };
    }
};
