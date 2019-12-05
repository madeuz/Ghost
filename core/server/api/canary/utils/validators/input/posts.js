const jsonSchema = require('../utils/json-schema');
const common = require('../../../../../lib/common');

const validateForPublish = (post) => {
    if (post.tags.length === 0) {
        return Promise.reject(new common.errors.ValidationError({message: 'Please provide at least one tag.'}));
    }
    if (!post.feature_image) {
        return Promise.reject(new common.errors.ValidationError({message: 'Please provide featured image.'}));
    }
    return true;
}

module.exports = {
    add(apiConfig, frame) {
        const schema = require(`./schemas/posts-add`);
        const definitions = require('./schemas/posts');
        const data = frame.data.posts[0];
        
        if (data.status !== 'draft') {
            const validForPublish = validateForPublish(data);
            if (validForPublish !== true) {
                return validForPublish;
            }
        }

        return jsonSchema.validate(schema, definitions, frame.data);
    },

    edit(apiConfig, frame) {
        const schema = require(`./schemas/posts-edit`);
        const definitions = require('./schemas/posts');
        const data = frame.data.posts[0];

        if (data.status !== 'draft') {
            const validForPublish = validateForPublish(data);
            if (validForPublish !== true) {
                return validForPublish;
            }
        }

        return jsonSchema.validate(schema, definitions, frame.data);
    }
};
