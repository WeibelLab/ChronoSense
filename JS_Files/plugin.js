import {Camera} from "./camera.js"

/**
 * Gets device of the current box being modified
 * @return {device} 
 */
export function get_device(camera) {
    return camera.getDeviceId();
}

/**
 * 
 * @param {*} device - Device is the current box being modified
 * @return {stream} - Video feed of current device 
 */
export function get_stream(device) {
    var videoElement = document.getElementById("camera-video-feed-container");
    videoElement = videoElement.childNodes[3].childNodes[0];
    return videoElement;
}

function write() {

}