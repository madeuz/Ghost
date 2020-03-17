const jsonSchema = require('../utils/json-schema');

module.exports = {
    add(apiConfig, frame) {
        const schema = require('./schemas/push-messages-add');
        const definitions = require('./schemas/push-messages');
        return jsonSchema.validate(schema, definitions, frame.data);
    },

    edit(apiConfig, frame) {
        const schema = require('./schemas/push-messages-edit');
        const definitions = require('./schemas/push-messages');
        return jsonSchema.validate(schema, definitions, frame.data);
    }
};
