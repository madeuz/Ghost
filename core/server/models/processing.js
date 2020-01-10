const ghostBookshelf = require('./base');

const Processing = ghostBookshelf.Model.extend({
    tableName: 'processing',

    parse(attrs) {
        attrs.data = JSON.parse(attrs.data);
        return attrs;
    },

    format(attrs) {
        // CASE: format will be called when formatting all data for the DB
        // including for SELECTs meaning that if we call findOne without
        // a data property we'll get unintended JSON.stringify(undefined) calls
        if (attrs.data) {
            attrs.data = JSON.stringify(attrs.data);
        }
        return attrs;
    }
});

const Processings = ghostBookshelf.Collection.extend({
    model: Processing
});

module.exports = {
    Processing: ghostBookshelf.model('Processing', Processing),
    Processings: ghostBookshelf.collection('Processings', Processings)
};
