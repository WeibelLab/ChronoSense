const { spawn } = require("child_process");
const path = require('path');

var isWin = process.platform === "win32";
const CHRONOSENSE_ROOT_DIR = path.join(path.resolve(__dirname), '../');
const FFMPEG_DIR = path.join(CHRONOSENSE_ROOT_DIR, '/ffmpeg/');

var dirName = "";
var fileName = "";

process.on('message', (msg) => {
    console.log('Message from parent:', msg);
    dirName = msg.dirName;
    fileName = msg.fileName;
    let pp = new postProcesser()
    pp.postProcessVideoFile();
});

class postProcesser {
    #c = null;
    constructor(
		
	) {

    }
    postProcessVideoFile() {
        if (!isWin) {
            this.#c = spawn("ffmpeg", [
                "-i",
                dirName.concat("raw/").concat(fileName),
                dirName.concat(fileName.substring(0, fileName.length - 5)).concat(".mp4")
            ], {detached: true});
            process.send({ pid: this.#c.pid, child_state: "processing" });
        }
        else {
            this.#c = spawn(FFMPEG_DIR.concat("ffmpeg.exe"), [
                "-i",
                dirName.concat("raw/").concat(fileName),
                dirName.concat(fileName.substring(0, fileName.length - 5)).concat(".mp4")
            ], {detached: true});
            process.send({ pid: this.#c.pid, child_state: "processing" });
        }
        this.#c.on('close', () => {
            process.send({ pid: this.#c.pid, child_state: "done" });
        });
    }
}