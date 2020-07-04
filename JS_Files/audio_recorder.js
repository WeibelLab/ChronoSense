const portAudio = require('naudiodon');
const fs = require('fs');
const wavHeaders = require('wav-headers');

export class AudioRecorder {
    audioIO;

    listAudioDevices(){
        console.log(portAudio.getDevices());
    }

    async readFileToBuffer(path) {
        return new Promise((resolve, reject) => {
          fs.readFile(path, function (err, data) {
            if (err) {
              reject(err);
            }
            resolve(data);
          });
        });
      }

    getFilesizeInBytes(filename) {
        var stats = fs.statSync(filename)
        var fileSizeInBytes = stats["size"]
        console.log(fileSizeInBytes);
        return fileSizeInBytes
    }

    startRecording(device_id, raw_path){
        this.audioIO = new portAudio.AudioIO({
            inOptions: {
              channelCount: 7,
              sampleFormat: portAudio.SampleFormat16Bit,
              sampleRate: 44100,
              deviceId: device_id, // Use -1 or omit the deviceId to select the default device
              closeOnError: true // Close the stream if an audio error is detected, if set false then just log the error
            }
          });
        var ws = fs.createWriteStream(raw_path);
        this.audioIO.pipe(ws);
        this.audioIO.start();
        console.log("recording audio!");
    }

    logAudioEvents(){
        this.audioIO.on('data', buf => console.log(buf.timestamp));
    }

    async stopRecording(raw_path, final_path){
        this.audioIO.quit();
    
        var wavHeaderOptions = {
            channels: 7,
            sampleRate: 44100,
            bitDepth: 16,
            dataLength: this.getFilesizeInBytes(raw_path)
        };
    
        var rawAudioBuffer = await this.readFileToBuffer(raw_path);
    
        var headersBuffer = wavHeaders(wavHeaderOptions);
        var fullBuffer = Buffer.concat([ headersBuffer, rawAudioBuffer ]);
        
        var stream = fs.createWriteStream(final_path);
        stream.write(fullBuffer, function() {
            stream.end();
        });
    
        console.log("stopped recording");
    }

    timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async init(){
        this.listAudioDevices();
        this.startRecording(1, "audio.raw");
        this.logAudioEvents();
        // record for 10 seconds
        await this.timeout(10000);
        await this.stopRecording("audio.raw", "audio.wav");
    }
}