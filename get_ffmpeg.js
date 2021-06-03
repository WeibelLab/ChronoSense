const path = require('path');
const fs = require('fs-extra');
const download = require('download');
const extract = require('extract-zip');
var isWin = process.platform === "win32";

const CHRONOSENSE_ROOT_DIR = path.resolve(__dirname);
const FFMPEG_DIR = path.resolve(CHRONOSENSE_ROOT_DIR, 'ffmpeg');
const FFMPEG_URL = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip";
const FFMPEG_ZIP = path.resolve(CHRONOSENSE_ROOT_DIR, 'ffmpeg-release-essentials.zip');

const init = async (callback) => {
    /* // Put it all under directory so script could clean up downloaded zips.
    if (!(await fs.pathExists(FFMPEG_ZIP))) {
        console.log('downloading ffmpeg to:' + CHRONOSENSE_ROOT_DIR);
        await fs.writeFile(FFMPEG_ZIP, await download(FFMPEG_URL));
    }
    */
    if (!isWin) {
        return;
    }

    if (!(await fs.pathExists(FFMPEG_DIR))) {
        console.log('downloading ffmpeg to:' + CHRONOSENSE_ROOT_DIR);
        await fs.writeFile(FFMPEG_ZIP, await download(FFMPEG_URL));

        console.log('extracting ffmpeg into:' + FFMPEG_DIR);
        await extractFile(FFMPEG_ZIP, FFMPEG_DIR);
        ext_file_list = recFindByExt(FFMPEG_DIR,'exe');
        ext_file_list.forEach(
            function (file) {
                console.log('copying ' + path.basename(file) + ' to ' + FFMPEG_DIR);
                fs.copySync(file, path.resolve(FFMPEG_DIR, path.basename(file)));
            }
        )
        // When finished, delete unzipped and zipped folders
        // Delete zip file
        fs.unlink(FFMPEG_ZIP, (err) => {
            if (err) {
                console.error(err);
                return;
            }
        });
        // Delete unzipped dir (not needed once executables copied out)
        let file = fs.readdirSync(FFMPEG_DIR).filter((filename) => {
            return fs.statSync(FFMPEG_DIR + "/" + filename).isDirectory();
        });
        console.log(file[0]);
        fs.rm(FFMPEG_DIR + "/" + file[0], {recursive: true, force: true}, (err) => {
            if (err) {
                console.error(err);
                return;
            }
        });

    }
};

async function extractFile(zipPath, dir) {
    await extract(zipPath, { dir: dir });

};

function recFindByExt(base,ext,files,result) 
{
    files = files || fs.readdirSync(base) 
    result = result || [] 

    files.forEach( 
        function (file) {
            var newbase = path.join(base,file)
            if ( fs.statSync(newbase).isDirectory() )
            {
                result = recFindByExt(newbase,ext,fs.readdirSync(newbase),result)
            }
            else
            {
                if ( file.substr(-1*(ext.length+1)) == '.' + ext )
                {
                    result.push(newbase)
                } 
            }
        }
    )
    return result
}

init();