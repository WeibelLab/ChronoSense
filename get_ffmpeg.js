const path = require('path');
const fs = require('fs-extra');
const download = require('download');
const extract = require('extract-zip');

const CHRONOSENSE_ROOT_DIR = path.resolve(__dirname);
const FFMPEG_DIR = path.resolve(CHRONOSENSE_ROOT_DIR, 'ffmpeg');
const FFMPEG_URL = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip";
const FFMPEG_ZIP = path.resolve(CHRONOSENSE_ROOT_DIR, 'ffmpeg-release-essentials.zip');

const init = async (callback) => {
    if (!(await fs.pathExists(FFMPEG_ZIP))) {
        console.log('downloading ffmpeg to:' + CHRONOSENSE_ROOT_DIR);
        await fs.writeFile(FFMPEG_ZIP, await download(FFMPEG_URL));
    }

    if (!(await fs.pathExists(FFMPEG_DIR))) {
        console.log('extracting ffmpeg into:' + FFMPEG_DIR);
        await extractFile(FFMPEG_ZIP, FFMPEG_DIR);
    }
};

const extractFile = (zipPath, dir) => {
    return new Promise((resolve, reject) => {
        extract(zipPath, { dir: dir }, err => {
            if (err) {
            return reject(err);
            }
            resolve();
        });
    });
};

init();
