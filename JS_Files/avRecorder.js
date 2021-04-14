const { spawn } = require("child_process");
const Stream = require("stream");
const path = require('path');
const fs = require("fs");
const blobReader = new FileReader();

const CHRONOSENSE_ROOT_DIR = path.join(path.resolve(__dirname), '../');
const FFMPEG_DIR = path.join(CHRONOSENSE_ROOT_DIR, '/ffmpeg/');


// Attempt 3: Make a seekable blob that is written directly to disk

import { RecordRTC, getSeekableBlob, invokeSaveAsDialog } from './RecordRTC.js';



export class AVRecorder {

	#mediaStream = null;
	#fileName = null;
	#dirName = null;

	#blobs = [];

	#recorder = null;
	#storageStream = null;

	constructor(
		mediaStream = null,
		dirName = null,
		fileName = null
	) {
		this.#mediaStream = mediaStream;
		this.#dirName = dirName  //.replace(/\s/g,''); //regex away whitespace characters Note: unnecessary due to dialog box selection.
		// TODO: add \ or / depending on OS but for now just add \ for every dir string (i.e. assume windows)
		this.#dirName = this.#dirName.concat("\\");

		this.#fileName = fileName;
		this.#fileName = this.#fileName.replace(/[/\\?%*:|"<>]/g, '');
		this.#fileName = this.#fileName.replace(/\s/g,''); //regex away whitespace characters
		this.#fileName = this.#fileName.concat(".mkv"); //Add file extension at the end of the file

		this.#storageStream = fs.createWriteStream(this.#dirName.concat(this.#fileName));

		this.#recorder = RecordRTC(this.#mediaStream, {
			type: 'video',								// TODO: Allow user to modify
			mimeType: 'video/x-matroska;codecs=avc1',	// TODO: Allow user to modify

		});

		// When data is loaded into the FileReader, write to disk and then check if data in queue to load next
		blobReader.onload = (event) => {
			console.log("DATA WRITTEN TO STORAGE STREAM");
			this.#storageStream.write(Buffer.from(event.currentTarget.result));
			// Check for data waiting in queue
			if (this.#blobs.length > 0) {
				blobReader.readAsArrayBuffer(this.#blobs.shift());
			}
		};

	}

	/**
	 * startRecording() starts recording the current MediaStream object to file.
	 * 
	 */
	startRecording() {
		this.#recorder.startRecording();

	}

	/**
	 * stopRecording() stop and saves the current recording.
	 * 
	 */
	stopRecording() {
		this.#recorder.stopRecording(() => {
			this.recordSeekableBlob(this.#recorder.getBlob());
		});
	}

	recordSeekableBlob(blob) {
		getSeekableBlob(blob, (seekableBlob) => {
			// If FileReader is currently loading data (1), add to blob queue. If finished (2) or empty (0), immediately start reading in data 
			if (blobReader.readyState != 1) {
				console.log("AVAILABLE DATA READ INTO BLOB READER");
				blobReader.readAsArrayBuffer(seekableBlob);

			} else {
				console.log("AVAILABLE DATA PUSHED INTO BLOB");
				this.#blobs.push(seekableBlob);
			}
		
		});

	}

} //End of AVRecorder Class























































/* WORKING CLASS THAT SAVES DIRECTLY TO A SPECIFIED DIR AND FILE BUT DOESN'T HAVE VIDEO METADATA (i.e. not seekable)
export class AVRecorder {

	#mediaStream = null;
	#blobs = [];
	#dirName = null;
	#fileName = null;

	#storageStream = null;
	#recorder = null;

	constructor(
		mediaStream = null,
		dirName = null,
		fileName = null
	) {
		this.#mediaStream = mediaStream;
		this.#dirName = dirName  //.replace(/\s/g,''); //regex away whitespace characters Note: unnecessary due to dialog box selection.
		// TODO: add \ or / depending on OS but for now just add \ for every dir string (i.e. assume windows)
		this.#dirName = this.#dirName.concat("\\");

		this.#fileName = fileName;
		this.#fileName = this.#fileName.replace(/[/\\?%*:|"<>]/g, '');
		this.#fileName = this.#fileName.replace(/\s/g,''); //regex away whitespace characters
		this.#fileName = this.#fileName.concat(".mp4"); //Add file extension at the end of the file

		// TODO: modifications of dir/file names AND check/creation of directory

		this.#recorder = new MediaRecorder(mediaStream); //TODO: allow modification of options dict param by user. 

		this.#storageStream = fs.createWriteStream(this.#dirName.concat(this.#fileName));

		// Attach methods to events for storing data and capturing blob outputs 
		// Every timeslice (or on completion) the MediaRecorder dumps blob from memory into storage via a writestream
		this.#recorder.ondataavailable = (event) => {
			console.log("DATA AVAILABLE");
			// If FileReader is currently loading data (1), add to blob queue. If finished (2) or empty (0), immediately start reading in data 
			if (blobReader.readyState != 1) {
				console.log("AVAILABLE DATA READ INTO BLOB READER");
				blobReader.readAsArrayBuffer(event.data);

			} else {
				console.log("AVAILABLE DATA PUSHED INTO BLOB");
				this.#blobs.push(event.data);
			}
		};
		// When data is loaded into the FileReader, write to disk and then check if data in queue to load next
		blobReader.onload = (event) => {
			console.log("DATA WRITTEN TO STORAGE STREAM")
			this.#storageStream.write(Buffer.from(event.currentTarget.result));
			// Check for data waiting in queue
			if (this.#blobs.length > 0) {
				blobReader.readAsArrayBuffer(this.#blobs.shift());
			}
		};

	}

	/**
	 * startRecording() starts recording the current MediaStream object to file.
	 * 
	 
	startRecording() {
		this.#recorder.start(500); //timeslice every 500ms

	}

	/**
	 * stopRecording() stop and saves the current recording.
	 * 
	 
	stopRecording() {
		this.#recorder.stop();
	}

} //End of AVRecorder Class
*/
































/* WORKING RECORDER CLASS WITH SAVE DIALOG
import { RecordRTC, getSeekableBlob, invokeSaveAsDialog } from './RecordRTC.js';


export class AVRecorder {

	#mediaStream = null;
	#fileName = null;

	#recorder = null;

	constructor(
		mediaStream = null,
		fileName = null
	) {
		this.#mediaStream = mediaStream;
		this.#fileName = fileName.replace(/\s/g,''); //regex away whitespace characters

		this.#recorder = RecordRTC(this.#mediaStream, {
			type: 'video',								// TODO: Allow user to modify
			mimeType: 'video/x-matroska;codecs=avc1'	// TODO: Allow user to modify
		});
	}

	/**
	 * startRecording() starts recording the current MediaStream object to file.
	 * 
	 *
	startRecording() {
		this.#recorder.startRecording();

	}

	/**
	 * stopRecording() stop and saves the current recording.
	 * 
	 *
	stopRecording() {
		this.#recorder.stopRecording(() => {
			getSeekableBlob(this.#recorder.getBlob(), (seekableBlob) => {
				invokeSaveAsDialog(seekableBlob, this.#fileName.concat(".mkv"));
			});
		});
	}

} //End of AVRecorder Class
*/