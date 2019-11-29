const fsPromises = require('fs').promises;
const Promise = require('bluebird');
const path = require('path');
const uuid = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const common = require('../../../lib/common');
const storage = require('../../../adapters/storage');

const createProcessingTask = (session) => {
    if (!session.processing) {
        session.processing = {}
    }

    const processUUID = uuid.v4();
    const data = session.processing[processUUID] = { finished: false };
    const save = () => {
        return new Promise((resolve) => {
            session.save((err) => {
                if (err) throw err;
                resolve();
            });
        })
    }

    return [ processUUID, { data, save } ];
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

const encodeVideoFile = (filePath, outputPath, videoName, progressStore) => {
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
            progressStore.data.progress = progress.percent;
            progressStore.save();
        })
        .on('error', err => {
            fsPromises.unlink(filePath);
            throw err;
        })
        .on('end', () => {
            fsPromises.unlink(filePath);
            resolve({
                path: outputPath,
                name: videoName,
                type: 'video/mp4'
            })
        })
        .save(outputPath);
    })
}

const startVideoProcessing = async (filePath, fileName, taskStore, fileStorage) => {
    const parsedVideoPath = path.parse(filePath);
    const parsedVideoName = path.parse(fileName);
    const originalVideoPath = path.join(parsedVideoPath.dir, `${parsedVideoPath.name}_o${parsedVideoPath.ext}`);

    try {
        await fsPromises.rename(filePath, originalVideoPath);

        const videoMetadata = await probeVideo(originalVideoPath);
        taskStore.data.video = {
            width: videoMetadata.streams[0].width,
            height: videoMetadata.streams[0].height
        }
        
        const screenshot = await makeScreenshot(originalVideoPath, parsedVideoName.name);
        taskStore.data.poster = await fileStorage.save(screenshot);
        fsPromises.unlink(screenshot.path);
        
        const video = await encodeVideoFile(originalVideoPath, filePath, fileName, taskStore);
        taskStore.data.url = await fileStorage.save(video);
        fsPromises.unlink(filePath);
        
        taskStore.data.finished = true;
        taskStore.save();
    }
    catch (err) {
        fsPromises.unlink(filePath);
        taskStore.data.error = err.message;
        taskStore.save();
        common.logging.error(new common.errors.GhostError({
            err,
            level: 'critical'
        }));
    }
}

module.exports = function videoEncode(req, res, next) {
    const [ taskId, taskStore ] = createProcessingTask(req.session);
    startVideoProcessing(req.file.path, req.file.name, taskStore, storage.getStorage());

    req.disableUploadClear = true;
    req.processUUID = taskId;
    next();
};
