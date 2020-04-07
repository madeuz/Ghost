const Promise = require('bluebird');
const common = require('../../lib/common');
const models = require('../../models');

module.exports = {
    docName: 'pushmessages',

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
            return models.PushMessage.findPage(frame.options);
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
            return models.PushMessage.findOne(frame.data, frame.options)
                .then((model) => {
                    if (!model) {
                        return Promise.reject(new common.errors.NotFoundError({
                            message: common.i18n.t('errors.api.tags.tagNotFound')
                        }));
                    }

                    return model;
                });
        }
    },

    add: {
        statusCode: 201,
        options: [],
        permissions: true,
        query(frame) {
            return models.PushMessage.add(frame.data.pushMessages[0], frame.options);
        }
    },

    edit: {
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
            return models.PushMessage.edit(frame.data.pushMessages[0], frame.options)
                .then((model) => {
                    if (!model) {
                        return Promise.reject(new common.errors.NotFoundError({
                            message: common.i18n.t('errors.api.pushMessages.pushMessageNotFound')
                        }));
                    }
                    return model;
                });
        }
    },

    destroy: {
        statusCode: 204,
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
            return models.PushMessage.destroy(frame.options).return(null);
        }
    }
};
