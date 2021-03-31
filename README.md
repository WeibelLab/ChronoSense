# ChronoSenseV3

![alt text](./readme_images/ChronoSenseScreenshot.webp "ChronoSenseV3 3/4/21")


## Installation / run with Docker

-   Clone/pull this repository and move into it with `cd chronosense`
-   Create the base image from dockerfile in build directory with`docker build ./Docker -t chronosense` (only need to do this the first time)
-   Since Electron wants a chromium window, it helps to install x11 (XQuartz on MacOS and Xming on Windows) for window forwarding
-   [On MacOS] be sure to activate the option ‘Allow connections from network clients’ in XQuartz settings, then quit and restart XQuartz
-   [On MacOS] run `xhost +` to grant permission for the remote display
-   [On Windows] be sure that Xming is running
-   Enter the docker image `docker run -it -e DISPLAY=host.docker.internal:0 -v /tmp/.X11-unix:/tmp/.X11-unix -v </absolute/path/to/git/repo/>:/chronosense chronosense`

## Run ChronoSense Electron App:

-   CD into chronosense folder and enter the command `npm install` to make sure you have all the needed dependencies/electron (node-gyp, kinect-azure, production windows build tools, etc.).
-   Next enter `npm start` and the application window will open up.
-   If you get a `electron: cannot execute binary file` error, run `npm install electron@^8.0.2` then try again

## Get Up and Running for Developing:

1.  Clone the repository to a location of your choosing using the command:  
    `git clone https://github.com/WeibelLab/ChronoSenseV3.git`

2.  Make sure you have [Node.js](https://nodejs.org/en/) installed (includes node and npm commands).

3.  Navigate to where you cloned the ChronoSenseV3 folder and run the command:  
    `npm install`

4.  **(Optional)** If there are submodules not fully cloned in the ChronoSenseV3 folder, run the command:  
    `git submodule update --init --recursive`

5.  **(If on Windows)** Install node-gyp to fix some errors that may occur:  
    `npm install -g node-gyp`

6.  **(If on Windows)** Install all the required tools and configurations using Microsoft's windows-build-tools using  
    `npm install --global --production windows-build-tools` from an elevated PowerShell or CMD.exe (run as Administrator).

7.  Once you have the submodule installed for the 'kinect-azure' module (or in the node_modules folder), go to kinect-azure/ and enter the following command:  
    `npm install`

    -   _The above command will download the sensor dlls and other necessary files to use the Kinect in development and application use._

8.  Move the files that were created with the above command into the main ChronoSenseV3 folder.
    List of Files to move:

    -   cublas64_100.dll
    -   cudart64_100.dll
    -   cudnn64_7.dll
    -   dnn_model_2_0.onnx
    -   onnxruntime.dll
    -   vcomp140.dll

9.  Test to see if the application (as it is) can now run by going to the main ChronoSenseV3 folder and typing the following command to start the application:  
    `npm start`

10. Ready to Develop!  

## Create Executable Package  
1. Clone the repository  
2. Run `npm install` in the cloned repo directory  
3. Run `npm run package`  
4. Look for newly created directory inside of your current repo directory which will contain the created executable for ChronoSense

## Change Notes (Updated: 3/4/21):

Summary: All camera devices that are plugged in (or already plugged in at launch) update on the application central, universal list of devices that are then available for the application to use in any manner. They will be automatically connected to the necessary SDKs/APIs to optimize their performance.

-   webcam.js => camera.js in order to generalize devices beyond webcams as we move towards a more device-agnostic data collection application.
-   camera.js now represents a single "camera" device object with methods that reflect that purpose.
-   kinect.js now represents a single Kinect device object.
-   kinect.js uses my recently pushed changes to the Kinect-Azure package which allow a specific webcam to be selected and opened, serial number retrieval, and getting the # of Kinects currently attached to the system.
-   GitHub repo for Chronosense and Kinect-Azure organization submodule have been cleaned up and reorganized to allow for easier development and understanding of Chronosense's current status.
-   The "audio" branch has been merged into the current branch I'm using for development (audio_recorder.js added but calls to it removed from chronosense.js).
-   Correct references to the submodule (local) added so any developer may clone the repo and immediately have access to the working build.
-   Change in procedure where I now list out the goal of the current branch at the top of the README and try to keep track of all large changes that will be added to "change notes" once it is merged into the master branch.
-   In regards to generalizing devices, the main chronosense.js file now uses arrays/lists of device objects created through kinect.js & camera.js for easy updates to the UI to allow the user to know at all times which devices are available and in which page.
-   After a lot of testing and troubleshooting, I found that the SDK/Azure Kinect hardware doesn't give us enough information regarding its current status. With that in mind, I changed from an "update on plug-in" model to a manual refresh button that is working perfectly with the inherent delay of the SDK.
-   Multiple Kinects ARE working (simultaneous streaming limited by kinect-azure package at the moment) and detected when plugged in to a single system. (Update 3/4/21: All Kinects are treated as cameras until Kinect package allows for multiple Kinects simultaneously)
-   The Camera page now dynamically fills its list with the connected devices and allows the user to click on them to add video preview elements to the UI. Multiple video streams are able to run at the same time.
-   Swapping between pages properly disposes of active streams and UI elements to cease duplication and speed up the main process thread.  
- Screen Recording is now available, allowing the user to select a screen or window they would like to preview/record in ChronoSense.  
- Currently all cameras and video feeds are set to a resolution of 1280x720.
- Multicamera previewing and recording is now working with minimal impact on performance (tested up to 4 inputs - Screen Capture, webcam, and 2 Kinects simultaneously).
- On "Stop Recording," the user is now able to name the file and change the file extension. They can also select the save path.
- UI has been cleaned up and scales correctly with window adjustments and different resolution monitors.
- "Scaffolding" in the UI has been removed and now more accurately represents the final product.
- Saved video files are now scrubbable and have the correct metadata of a normal video file. 
 
## Fixes [Note: may not be needed in README anymore after bugfix committed]

-   Fix for "Uncaught Error: The module '//........'  
    ![alt text](./readme_images/electronRebuildError.PNG "Error Notification")
    1. Rebuild the Electron package  
       i. Run a fresh install: `npm install`  
       ii. Run the command: `npm i -D electron-rebuild`  
       iii. Run this from your application's base directory: `./node_modules/.bin/electron-rebuild.cmd`
    2. Reset node_modules/  
       i. Delete your current node_modules directory  
       ii. Follow the steps in (1.) above
