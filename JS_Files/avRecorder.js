const { spawn } = require("child_process");
const Stream = require("stream");

export class AVRecorder {
	#recorder = null;
	#canvas = null;
	#canvasContext = null;
	#audioSource = null;

	#stream = null;
	#pipeStatus = false;

	#fileName = "testVideo";

	#chunksAwaitingPipe = 0;

	constructor(
		canvas = null,
		context = null,
		audioSource = null,
		fileName = "testVideo"
	) {
		this.#canvas = canvas;
		this.#canvasContext = context;
		this.#audioSource = audioSource;

		this.#fileName = fileName;
	}

	/**
	 * Call this to spawn a child process that runs FFMPEG and waits for data
	 * to be supplied to stdin (of subprocess).
	 *
	 * @param {number} type - value indicating what to record (video, audio, both, etc.);
	 *                        Values: 0 - video,
	 *                                1 - audio,
	 *                                2 - video & audio
	 */
	recorderSetup(type) {
		// First check if there is an existing process and clear it.
		if (this.#recorder !== null) {
			//! Change to match current set up
			this.#recorder.stdin.end(); //Send end code to finish writing data
			this.#recorder.kill(); //Kill child process to save resources
			// ! TODO: Add events to handle subprocess closing events
		}

		// Now instantiate new subprocess to handle data -> file (ADD OPTIONS)
		switch (type) {
			// Audio
			case 1:
				break;

			// Video & Audio
			case 2:
				break;

			// Video (default & 0)
			default:
				// ! TODO: Maybe change these params (like res) to match canvas attributes?
				// ! For now, test to make sure class works as expected
				// ! TODO: Make file name scheme more dynamic to not overwrite previous or break future calls.
				this.#recorder = spawn("ffmpeg", [
					"-hide_banner",
					"-f",
					"rawvideo",
					"-pix_fmt",
					"rgba",
					"-video_size",
					"1920x1080",
					"-framerate",
					"30",
					"-i",
					"-",
					"-c:v",
					"libx264",
					"-preset",
					"faster",
					`${this.#fileName}.mkv`,
				]);
		}

		this.#stream = new Stream.Readable({ read() {} });
		this.#pipeStatus = false;
	}

	/**
	 * Call to add new canvas frame data to video file.
	 *
	 */
	writeToFile() {
		// ! TODO: Maybe change it to an interval based system?
		/*
		this.#recorder.stdin.write(
			new Uint8Array(
				this.#canvasContext.getImageData(
					0,
					0,
					this.#canvas.width,
					this.#canvas.height
				).data.buffer
			)
		);
		*/
		// ! TEST: Use # to indicate if chunks still waiting to send before closing
		this.#chunksAwaitingPipe++;

		this.#stream.push(
			new Uint8Array(
				this.#canvasContext.getImageData(
					0,
					0,
					this.#canvas.width,
					this.#canvas.height
				).data.buffer
			)
		);
		if (!this.#pipeStatus) {
			this.#stream.pipe(this.#recorder.stdin);
			this.#pipeStatus = true;
		}
		this.#chunksAwaitingPipe--;
	}

	/**
	 * Close and save recording file
	 */
	closeFile() {
		// ! While loop awaits any left over chunks in the read stream to be processed before closing.
		// ! Hard to test but seems like it works without any hitching
		while (this.#chunksAwaitingPipe >= 1) {
			console.log("CHUNKS STILL  WAITING TO PROCESS");
		}
		this.#stream.push(null);
	}

	/**
	 * Kills the child/sub process after closing the file.
	 */
	killSub() {
		this.#recorder.kill("SIGINT");
	}
} //End of AVRecorder Class
