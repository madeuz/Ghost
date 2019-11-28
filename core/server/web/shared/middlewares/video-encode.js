const fsPromises = require('fs').promises;
const Promise = require('bluebird');
const path = require('path');
const uuid = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const common = require('../../../lib/common');
const storage = require('../../../adapters/storage');

module.exports = function videoEncode(req, res, next) {
    const videoPath = req.file.path;
    const parsedVideoName = path.parse(req.file.name);
    const parsedVideoPath = path.parse(videoPath);
    const originalVideoPath = path.join(parsedVideoPath.dir, `${parsedVideoPath.name}_o${parsedVideoPath.ext}`);

    if (!req.session.processing) {
        req.session.processing = {}
    }
    
    const processUUID = uuid.v4();
    req.processUUID = processUUID;

    const store = storage.getStorage();
    const sessionData = req.session.processing[processUUID] = { finished: false }
    
    const saveSession = () => {
        return new Promise((resolve) => {
            req.session.save((err) => {
                if (err) throw err;
                resolve();
            });
        })
    }
    
    const probeVideo = (filePath) => {
        return new Promise((resolve) => {
            ffmpeg.ffprobe(filePath, (err, data) => {
                if (err) throw err;
                resolve(data);
            });
        })
    }

    const makeScreenshot = (filePath, screenshotName) => {
        const filePathData = path.parse(filePath);
        return new Promise((resolve) => {
            ffmpeg(filePath)
            .on('error', err => {
                fsPromises.unlink(filePath);
                throw err;
            })
            .on('end', function() {
                resolve({
                    path: path.join(filePathData.dir, `${filePathData.name}.jpg`),
                    name: `${screenshotName}.jpg`,
                    type: 'image/jpeg'
                })
            })
            .screenshots({
                timestamps: ['50%'],
                filename: `${filePathData.name}.jpg`,
                folder: filePathData.dir
            });
        })
    }

    const encodeVideoFile = (filePath, outputPath) => {
        return new Promise((resolve) => {
            ffmpeg(filePath)
            .format('mp4')
            .videoCodec('libx264')
            .outputOptions([
                '-crf 28',
                '-level 3',
                '-preset slow',
                '-pix_fmt yuv420p',
                '-profile:v baseline',
                '-movflags +faststart'
            ])
            .on('progress', progress => {
                sessionData.progress = progress.percent;
                saveSession();
            })
            .on('error', err => {
                fsPromises.unlink(filePath);
                throw err;
            })
            .on('end', () => {
                fsPromises.unlink(filePath);
                resolve(req.file)
            })
            .save(outputPath);
        })
    }

    fsPromises.rename(videoPath, originalVideoPath)
        .then(() => probeVideo(originalVideoPath))
        .then(data => {
            sessionData.video = {
                width: data.streams[0].width,
                height: data.streams[0].height
            }
            return saveSession();
        })
        .then(() => makeScreenshot(originalVideoPath, parsedVideoName.name))
        .then(file => store.save(file))
        .then(url => {
            sessionData.poster = url;
            return saveSession();
        })
        .then(() => encodeVideoFile(originalVideoPath, videoPath))
        .then(file => store.save(file))
        .then(url => {
            fsPromises.unlink(videoPath);
            sessionData.finished = true;
            sessionData.url = url;
            return saveSession();
        })
        .catch(err => {
            fsPromises.unlink(videoPath);
            sessionData.error = err.message;
            saveSession();
            common.logging.error(new common.errors.GhostError({
                err,
                level: 'critical'
            }));
        })

    next();
};
