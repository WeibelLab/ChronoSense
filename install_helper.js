const { exec } = require("child_process");
var isWin = process.platform === "win32";

const init = async (callback) => {
    if(isWin){
        exec('.\\node_modules\\.bin\\electron-rebuild.cmd',
        (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });
    }
    else {
        exec('./node_modules/.bin/electron-rebuild',
        (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });
    }
}

init();