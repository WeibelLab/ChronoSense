const { spawn } = require("child_process");
const Stream = require("stream");
const path = require('path');

const CHRONOSENSE_ROOT_DIR = path.join(path.resolve(__dirname), '../');
const FFMPEG_DIR = path.join(CHRONOSENSE_ROOT_DIR, '/ffmpeg/');

import { RecordRTC, getSeekableBlob, invokeSaveAsDialog } from './RecordRTC.js';


export class AVRecorder {

	#mediaStream = null;
	#deviceName = null;

	#recorder = null;

	constructor(
		mediaStream = null,
		deviceName = null
	) {
		this.#mediaStream = mediaStream;
		this.#deviceName = deviceName;

		this.#recorder = RecordRTC(this.#mediaStream, {
			type: 'video',								// TODO: Allow user to modify
			mimeType: 'video/x-matroska;codecs=avc1'	// TODO: Allow user to modify
		});
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
			getSeekableBlob(this.#recorder.getBlob(), (seekableBlob) => {
				invokeSaveAsDialog(seekableBlob, this.#deviceName);
			});
		});

	}



} //End of AVRecorder Class