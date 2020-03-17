const debug = require('ghost-ignition').debug('api:canary:utils:serializers:output:subscriptions');
const mapper = require('./utils/mapper');

module.exports = {
    all(models, apiConfig, frame) {
        debug('all');

        if (!models) {
            return;
        }

        if (models.meta) {
            frame.response = {
                subscriptions: models.data.map(model => mapper.mapSubscription(model, frame)),
                meta: models.meta
            };

            return;
        }

        frame.response = {
            subscriptions: [mapper.mapSubscription(models, frame)]
        };
    }
};
