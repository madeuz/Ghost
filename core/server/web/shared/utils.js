const url = require('url');
const path = require('path');
const fsPromises = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const storage = require('../../adapters/storage');

const _private = {};

_private.removeDoubleCharacters = (character, string) => {
    const stringArray = string.split('');

    return stringArray.reduce((newString, currentCharacter, index) => {
        if (
            currentCharacter === character &&
            stringArray[index + 1] === character
        ) {
            return newString;
        }

        return `${newString}${currentCharacter}`;
    }, '');
};

module.exports.removeOpenRedirectFromUrl = function removeOpenRedirectFromUrl(urlString) {
    const parsedUrl = url.parse(urlString);

    return (
        // http://
        (parsedUrl.protocol ? parsedUrl.protocol + '//' : '') +
        (parsedUrl.auth || '') +
        (parsedUrl.host || '') +
        _private.removeDoubleCharacters('/', parsedUrl.path) +
        (parsedUrl.hash || '')
    );
};

module.exports.checkFileExists = function checkFileExists(fileData) {
    return !!(fileData.mimetype && fileData.path);
};

module.exports.checkFileIsValid = function checkFileIsValid(fileData, types, extensions) {
    const type = fileData.mimetype;

    if (types.includes(type) && extensions.includes(fileData.ext)) {
        return true;
    }

    return false;
};

module.exports.videoPoster = async function videoPoster(src, time) {
    const parsedUrl = url.parse(src);
    const fileName = path.basename(parsedUrl.path.split('/').pop(), '.mp4');
    const filePath = path.join('/tmp', `${fileName}.jpg`);

    const screenshot = await new Promise((resolve) => {
        ffmpeg(src)
            .on('error', (err) => {
                throw err;
            })
            .on('end', function () {
                resolve({
                    path: filePath,
                    name: `${fileName}.jpg`,
                    type: 'image/jpeg'
                });
            })
            .screenshots({
                timestamps: [time],
                filename: `${fileName}.jpg`,
                folder: '/tmp'
            });
    });

    const poster = await storage.getStorage().save(screenshot);
    fsPromises.unlink(filePath);
    return {src: poster};
};
