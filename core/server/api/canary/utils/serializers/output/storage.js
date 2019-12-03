const debug = require('ghost-ignition').debug('api:canary:utils:serializers:output:storage');
const mapper = require('./utils/mapper');

module.exports = {
    upload(path, apiConfig, frame) {
        debug('upload');

        return frame.response = {
            files: [{
                url: mapper.mapFile(path),
                ref: frame.data.ref || null
            }]
        };
    }
};
