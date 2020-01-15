const fsPromises = require('fs').promises;
const Promise = require('bluebird');
const path = require('path');
const uuid = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const common = require('../../../lib/common');
const storage = require('../../../adapters/storage');
const models = require('../../../models');

const storageObject = storage.getStorage();
storageObject.getUniqueFileName = function (image, targetDir) {
    var ext = path.extname(image.name), name;
    name = this.getSanitizedFileName(path.basename(image.name, ext));
    return this.generateUnique(targetDir, name, ext, 0);
};

const createProcessingTask = async () => {
    const task = {
        uuid: uuid.v4(),
        status: 'new',
        data: {},
        progress: 0
    };
    const taskModel = await models.Processing.add(task);
    return [task.uuid, taskModel];
};

const probeVideo = (filePath) => {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(filePath, (err, data) => {
            if (err) {
                throw err;
            }
            resolve(data);
        });
    });
};

const makeScreenshot = (filePath, screenshotName) => {
    const filePathData = path.parse(filePath);
    return new Promise((resolve) => {
        ffmpeg(filePath)
            .on('error', (err) => {
                fsPromises.unlink(filePath);
                throw err;
            })
            .on('end', function () {
                resolve({
                    path: path.join(filePathData.dir, `${filePathData.name}.jpg`),
                    name: `${screenshotName}.jpg`,
                    type: 'image/jpeg'
                });
            })
            .screenshots({
                timestamps: ['50%'],
                filename: `${filePathData.name}.jpg`,
                folder: filePathData.dir
            });
    });
};

const throttle = (func, limit) => {
    let lastFunc;
    let lastRan;
    return function () {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function () {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
};

const throttledEdit = throttle(models.Processing.edit, 1000);

const encodeVideoFile = (filePath, outputPath, videoName, taskModel) => {
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
            .on('progress', (progress) => {
                throttledEdit.call(models.Processing, {
                    progress: progress.percent.toFixed(2),
                    status: 'running'
                }, {id: taskModel.id});
            })
            .on('error', (err) => {
                fsPromises.unlink(filePath);
                throw err;
            })
            .on('end', () => {
                fsPromises.unlink(filePath);
                resolve({
                    path: outputPath,
                    name: videoName,
                    type: 'video/mp4'
                });
            })
            .save(outputPath);
    });
};

const startVideoProcessing = async (filePath, fileName, taskModel, fileStorage) => {
    const parsedVideoPath = path.parse(filePath);
    const parsedVideoName = path.parse(fileName);
    const originalVideoPath = path.join(parsedVideoPath.dir, `${parsedVideoPath.name}_o${parsedVideoPath.ext}`);

    try {
        await fsPromises.rename(filePath, originalVideoPath);

        const taskData = taskModel.data || {};

        const videoMetadata = await probeVideo(originalVideoPath);
        let width, height;
        videoMetadata.streams.forEach((stream) => {
            if (stream.width && stream.height) {
                width = stream.width;
                height = stream.height;
            }
        });
        taskData.video = {width, height};

        const screenshot = await makeScreenshot(originalVideoPath, parsedVideoName.name);
        taskData.poster = await fileStorage.save(screenshot);
        fsPromises.unlink(screenshot.path);

        const video = await encodeVideoFile(originalVideoPath, filePath, fileName, taskModel);
        taskData.url = await fileStorage.save(video);
        fsPromises.unlink(filePath);

        models.Processing.edit({
            data: taskData,
            status: 'finished',
            progress: 100
        }, {id: taskModel.id});
    } catch (err) {
        fsPromises.unlink(filePath);
        models.Processing.edit({
            data: {error: err.message},
            status: 'error'
        }, {id: taskModel.id});
        common.logging.error(new common.errors.GhostError({
            err,
            level: 'critical'
        }));
    }
};

module.exports = async function videoEncode(req, res, next) {
    let taskUUID, taskModel;

    try {
        [taskUUID, taskModel] = await createProcessingTask();
    } catch (err) {
        common.logging.error(new common.errors.GhostError({
            err,
            level: 'critical'
        }));
        next();
        return;
    }

    startVideoProcessing(req.file.path, req.file.name, taskModel, storageObject);

    req.disableUploadClear = true;
    req.processUUID = taskUUID;
    next();
};
