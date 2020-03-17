const Promise = require('bluebird');
const common = require('../../lib/common');
const models = require('../../models');

module.exports = {
    docName: 'subscriptions',

    browse: {
        options: [
            'filter',
            'fields',
            'limit',
            'order',
            'page',
            'debug'
        ],
        permissions: true,
        query(frame) {
            return models.Subscription.findPage(frame.options);
        }
    },

    read: {
        options: [
            'filter',
            'fields',
            'debug'
        ],
        data: [
            'id',
            'status'
        ],
        permissions: true,
        query(frame) {
            return models.Subscription.findOne(frame.data, frame.options)
                .then((model) => {
                    if (!model) {
                        return Promise.reject(new common.errors.NotFoundError({
                            message: common.i18n.t('errors.api.subscriptions.subscriptionNotFound')
                        }));
                    }

                    return model;
                });
        }
    },

    destroy: {
        statusCode: 204,
        headers: {
            cacheInvalidate: true
        },
        options: [
            'id'
        ],
        validation: {
            options: {
                id: {
                    required: true
                }
            }
        },
        permissions: true,
        query(frame) {
            return models.Subscription.destroy(frame.options).return(null);
        }
    }
};
