const fsPromises = require('fs').promises;
const path = require('path');
const uuid = require('uuid')
const ffmpeg = require('fluent-ffmpeg');
const common = require('../../../lib/common');
const storage = require('../../../adapters/storage');

module.exports = function videoEncode(req, res, next) {
    const videoPath = req.file.path;
    const parsedVideoPath = path.parse(videoPath);
    const originalVideoPath = path.join(parsedVideoPath.dir, `${parsedVideoPath.name}_o${parsedVideoPath.ext}`);

    if (!req.session.processing) {
        req.session.processing = {}
    }
    
    const processUUID = uuid.v4();
    req.processUUID = processUUID;

    const sessionData = req.session.processing[processUUID] = { finished: false }

    fsPromises.rename(videoPath, originalVideoPath)
        .then(() => {
            ffmpeg(originalVideoPath).ffprobe((err, data) => {
                if (err) throw err;

                sessionData.video = {
                    width: data.streams[0].width,
                    height: data.streams[0].height
                }
                req.session.save(function(err) {
                    if (err) throw err;
                })

                ffmpeg(originalVideoPath)
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
                        req.session.save(function(err) {
                            if (err) throw err;
                        })
                    })
                    .on('error', err => {
                        fsPromises.unlink(originalVideoPath);
                        throw err;
                    })
                    .on('end', () => {
                        fsPromises.unlink(originalVideoPath);
                        const store = storage.getStorage();
                        store.save(req.file)
                        .then(url => {
                            fsPromises.unlink(videoPath);
                            sessionData.finished = true;
                            sessionData.url = url;
                            req.session.save(function(err) {
                                if (err) throw err;
                            })
                        })
                        .catch(err => {
                            fsPromises.unlink(videoPath);
                            throw err;
                        })
                    })
                    .save(videoPath);
            });
        })
        .catch(err => {
            fsPromises.unlink(videoPath);
            sessionData.error = err.message;
            req.session.save();
            common.logging.error(new common.errors.GhostError({
                err,
                level: 'critical'
            }));
        })

    next();
};
