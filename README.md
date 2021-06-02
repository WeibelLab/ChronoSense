# ChronoSense

![alt text](./readme_images/ChronoSenseScreenshot.webp "ChronoSenseV3 3/4/21")  

## Overview  
ChronoSense is a foundational piece of recording software built on webtech with the express goal of making recording accesible, extensible, and ubiquitous no matter the device or operating system. Streaming data to other applications for decoupled, near real-time analysis and processing is an express goal of the system. The idea being that one large piece of the puzzle has been completed so future extensions and integrations (e.g. [MediaPipe](https://google.github.io/mediapipe/), [TensorFlow](https://www.tensorflow.org/), etc.) are wholly separate with data/video feed input from the web or locally existing as the only necessary connection that doesn't require another bespoke foundational piecee of recording software.  

*ChronoSense pushes the starting line forward in any AV research or development project.*

## Run ChronoSense Electron App:
1.   CD into chronosense folder and enter the command `npm install` to make sure you have all the needed dependencies & Electron.
2.   Next enter `npm start` and the application window will open up.  

## Get Up and Running for Developing:
1.  Clone the repository to a location of your choosing using the command:  
    `git clone https://github.com/WeibelLab/ChronoSenseV3.git`

2.  Make sure you have [Node.js](https://nodejs.org/en/) installed (includes node and npm commands).

3.  Navigate to where you cloned the ChronoSenseV3 folder and run the command:  
    `npm install`

4.  Test to see if the application (as it is) can now run by going to the main ChronoSenseV3 folder and typing the following command to start the application:  
    `npm start`

5. **(Optional)** Go into the main.js file and uncomment `mainWindow.webContents.openDevTools();` if you would like to see the debugging window while running the application. 

6. Ready to Develop!  

## Create Executable Package  
1. Clone the repository  
2. Run `npm install` in the cloned repo directory  
3. Run `npm run package`  
4. Look for newly created directory inside of your current repo directory which will contain the created executable for ChronoSense
