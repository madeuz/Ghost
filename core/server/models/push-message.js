const ghostBookshelf = require('./base');

const PushMessage = ghostBookshelf.Model.extend({
    tableName: 'push_messages'
});

const PushMessages = ghostBookshelf.Collection.extend({
    model: PushMessage
});

module.exports = {
    PushMessage: ghostBookshelf.model('PushMessage', PushMessage),
    PushMessages: ghostBookshelf.collection('PushMessages', PushMessages)
};
