const models = require('../../models');

module.exports = {
    docName: 'subscriptions',

    subscribe: {
        statusCode: 201,
        permissions: true,
        query(frame) {
            return models.Subscription.subscribe(frame.data, frame.options);
        }
    },

    unsubscribe: {
        statusCode: 204,
        permissions: true,
        query(frame) {
            return models.Subscription.unsubscribe(frame.data, frame.options).return(null);
        }
    }
};
