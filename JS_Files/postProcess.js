const { spawn } = require("child_process");
const path = require('path');

var isWin = process.platform === "win32";
const CHRONOSENSE_ROOT_DIR = path.join(path.resolve(__dirname), '../');
const FFMPEG_DIR = path.join(CHRONOSENSE_ROOT_DIR, '/ffmpeg/');

process.on('message', (msg) => {
    let pp = null;
    console.log('Message from parent:', msg);
    dirName = msg.dirName;
    fileName = msg.fileName;
    pp = new postProcesser(dirName, fileName)
    pp.postProcessVideoFile();
    pp = null;
});

class postProcesser {
    #c = null;
    #dirName = null;
    #fileName = null;
    constructor(dirName, fileName){
        this.#dirName = dirName;
        this.#fileName = fileName;
    }
    postProcessVideoFile() {
        if (isWin) {
            this.#c = spawn(FFMPEG_DIR.concat("ffmpeg.exe"), [
                "-i",
                this.#dirName.concat("raw/").concat(this.#fileName),
                this.#dirName.concat(this.#fileName.substring(0, this.#fileName.length - 5)).concat(".mp4")
            ], {detached: true});
            process.send({ pid: this.#c.pid, child_state: "processing" });
        }
        else {
            this.#c = spawn("ffmpeg", [
                "-i",
                this.#dirName.concat("raw/").concat(this.#fileName),
                this.#dirName.concat(this.#fileName.substring(0, this.#fileName.length - 5)).concat(".mp4")
            ], {detached: true});
            process.send({ pid: this.#c.pid, child_state: "processing" });
        }
        this.#c.on('close', () => {
            process.send({ pid: this.#c.pid, child_state: "done" });
        });
    }
}