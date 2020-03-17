const Promise = require('bluebird');
const debug = require('ghost-ignition').debug('api:canary:utils:validators:input:subscription');
const common = require('../../../../../lib/common');

module.exports = {
    subscribe(apiConfig, frame) {
        debug('subscribe');

        const data = frame.data;

        if (!data.endpoint) {
            return Promise.reject(new common.errors.ValidationError({message: 'No subscription endpoint provided.'}));
        }

        if (!data.keys.p256dh) {
            return Promise.reject(new common.errors.ValidationError({message: 'No subscription p256dh key provided.'}));
        }

        if (!data.keys.auth) {
            return Promise.reject(new common.errors.ValidationError({message: 'No subscription auth key provided.'}));
        }
    },

    unsubscribe(apiConfig, frame) {
        debug('unsubscribe');

        const data = frame.data;

        if (!data.endpoint || !data.keys.p256dh || !data.keys.auth) {
            throw new common.errors.BadRequestError({message: 'Wrong subscription data.'});
        }
    }
};
