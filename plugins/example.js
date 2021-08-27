import { Plugin } from "../JS_Files/plugin.js";
import { getDevices } from "../JS_Files/chronosense.js"

class Example extends Plugin {
    #deviceList = null;

    async init() {
        console.log("Hello from Example");
        this.#deviceList = await getDevices();
    }

    getUI() {
        this.#deviceList.forEach(device => {
            console.log(device);
        });
    }
}

export async function init(){
    let example = new Example("Example Plugin", "video", "camera");
    await example.init();
    example.getUI();
}