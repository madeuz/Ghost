const ghostBookshelf = require('./base');

const PushMessageSubscription = ghostBookshelf.Model.extend({
    tableName: 'push_messages_subscriptions'
}, {
    async upsert(data, unfilteredOptions) {
        const pushMessageId = unfilteredOptions.push_message_id;
        const subscriptionId = unfilteredOptions.subscription_id;
        const model = await this.findOne({push_message_id: pushMessageId, subscription_id: subscriptionId}, unfilteredOptions);
        if (model) {
            return this.edit(data, Object.assign({}, unfilteredOptions, {
                id: model.id
            }));
        }
        return this.add(data, unfilteredOptions);
    }
});

module.exports = {
    PushMessageSubscription: ghostBookshelf.model('PushMessageSubscription', PushMessageSubscription)
};
