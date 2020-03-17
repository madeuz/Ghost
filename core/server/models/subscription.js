const ghostBookshelf = require('./base');

const Subscription = ghostBookshelf.Model.extend({
    tableName: 'subscriptions',
    wasChanged: () => false
},{
    orderDefaultOptions: function orderDefaultOptions() {
        return {
            created_at: 'DESC',
            updated_at: 'DESC'
        };
    },

    subscribe: async function subscribe(data, unfilteredOptions) {
        const options = this.filterOptions(unfilteredOptions, 'add');

        data.p256dh = data.keys.p256dh;
        data.auth = data.keys.auth;

        data = this.filterData(data);

        let model = await this.forge({endpoint: data.endpoint}).fetch(options);
        if (model) {
            model.set(data);
        } else {
            model = this.forge(data);
        }
        return model.save(options);
    },

    unsubscribe: function unsubscribe(data, unfilteredOptions) {
        const options = this.filterOptions(unfilteredOptions, 'destroy');

        data.p256dh = data.keys.p256dh;
        data.auth = data.keys.auth;

        options.destroyBy = {
            endpoint: data.endpoint
        };

        const destroySubscription = () => {
            return ghostBookshelf.Model.destroy.call(this, options);
        };

        if (!options.transacting) {
            return ghostBookshelf.transaction((transacting) => {
                options.transacting = transacting;
                return destroySubscription();
            });
        }

        return destroySubscription();
    }
});

const Subscriptions = ghostBookshelf.Collection.extend({
    model: Subscription
});

module.exports = {
    Subscription: ghostBookshelf.model('Subscription', Subscription),
    Subscriptions: ghostBookshelf.collection('Subscriptions', Subscriptions)
};
