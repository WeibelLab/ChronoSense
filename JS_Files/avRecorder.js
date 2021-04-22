const { spawn } = require("child_process");
const Stream = require("stream");
const path = require('path');
const fs = require("fs");
/*
const CHRONOSENSE_ROOT_DIR = path.join(path.resolve(__dirname), '../');
const FFMPEG_DIR = path.join(CHRONOSENSE_ROOT_DIR, '/ffmpeg/');
*/

export class AVRecorder {

	#mediaStream = null;
	#blobs = [];
	#dirName = null;
	#fileName = null;

	#blobReader = null;

	#storageStream = null;
	#recorder = null;

	constructor(
		mediaStream = null,
		dirName = null,
		fileName = null
	) {
		this.#mediaStream = mediaStream;
		this.#dirName = dirName  //.replace(/\s/g,''); //regex away whitespace characters. Note: unnecessary due to dialog box selection.
		this.#dirName = this.#dirName.concat("/");
		// Check if directory exists, if not then create it
		if (!fs.existsSync(this.#dirName)) {
			fs.mkdirSync(this.#dirName);
		}

		this.#fileName = fileName;
		this.#fileName = this.#fileName.replace(/[/\\?%*:|"<>]/g, '');
		this.#fileName = this.#fileName.replace(/\s/g,''); //regex away whitespace characters
		this.#fileName = this.#fileName.concat(".mp4"); //Add file extension at the end of the file
		// Check if filename exists and if so add a 1 at the end
		let fileEndNum = 1;
		while (fs.existsSync(this.#dirName.concat(this.#fileName))) {
			// File name exists, change name and check again
			this.#fileName = this.#fileName.slice(0, this.#fileName.length - 4);
			this.#fileName = this.#fileName.concat(fileEndNum.toString());
			this.#fileName = this.#fileName.concat(".mp4");
			fileEndNum++;
		}

		this.#recorder = new MediaRecorder(mediaStream); //TODO: allow modification of options dict param by user. 

		this.#storageStream = fs.createWriteStream(this.#dirName.concat(this.#fileName));

		this.#blobReader = new FileReader();

		// Attach methods to events for storing data and capturing blob outputs 
		// Every timeslice (or on completion) the MediaRecorder dumps blob from memory into storage via a writestream
		this.#recorder.ondataavailable = (event) => {
			// If FileReader is currently loading data (1), add to blob queue. If finished (2) or empty (0), immediately start reading in data 
			if (this.#blobReader.readyState != 1) {
				this.#blobReader.readAsArrayBuffer(event.data);

			} else {
				this.#blobs.push(event.data);
			}
		};
		// When data is loaded into the FileReader, write to disk and then check if data in queue to load next
		this.#blobReader.onload = (event) => {
			this.#storageStream.write(Buffer.from(event.currentTarget.result));
			// Check for data waiting in queue
			if (this.#blobs.length > 0) {
				this.#blobReader.readAsArrayBuffer(this.#blobs.shift());
			}
		};

	}

	/**
	 * startRecording() starts recording the current MediaStream object to file.
	 */ 
	 
	startRecording() {
		this.#recorder.start(1000); //timeslice every 500ms

	}

	/**
	 * stopRecording() stop and saves the current recording.
	 */ 
	 
	stopRecording() {
		this.#recorder.stop();
	}

} //End of AVRecorder Class