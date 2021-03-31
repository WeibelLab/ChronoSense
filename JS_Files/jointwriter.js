/*
 * Description: File used to write Kinect joint data to a CSV file.
 *
 */
const fs = require('fs');
//const Stopwatch = require('timer-stopwatch'); // ! High security vulnerability; find other option 
const csvWriter = require('csv-write-stream');
//Check out: https://github.com/maxogden/csv-write-stream
//for detailed instructions on how to use csvWriter

export class JointWriter {
    #writer;
    #fileName;
    #stopwatch;
    #created = false; //Boolean value that indicates if the CSV has been created
    #firstStart = true; //Boolean value indicating whether first write to file.

    constructor() {
        this.startNewFile(); //On start new file, also start elapsed timer
        
    }  //End of constructor


    /* Write skeleton joint data to file or append to already created CSV*/
    writeToFile(skeleton) {
        // skeleton.joints[] 0-31 -> joint1-joint32
        var d = new Date();

        if (this.#firstStart) {
            this.timerStart(); //Start timer on first write
            this.#firstStart = false;
        }

        //Appends or creates new file
        //Create the joint CSV writer with headers for all Joints by default.
        this.#writer = new csvWriter({ sendHeaders: false}); 
        
        this.#writer.pipe(fs.createWriteStream(this.#fileName, {flags: 'a'}));
        
        //Leave kinect body then come back to kinect body and the below function
        //does not work leading to joints not displaying or writing.
        /* this.#writer.write({
            header1: skeleton.joints[0], 
            header2: skeleton.joints[1],
            header3: skeleton.joints[2], 
            header4: skeleton.joints[3], 
            header5: skeleton.joints[4], 
            header6: skeleton.joints[5], 
            header7: skeleton.joints[6],
            header9: skeleton.joints[7], 
            header8: skeleton.joints[8], 
            header10: skeleton.joints[9], 
            header11: skeleton.joints[10], 
            header12: skeleton.joints[11], 
            header13: skeleton.joints[12], 
            header14: skeleton.joints[13], 
            header15: skeleton.joints[14], 
            header16: skeleton.joints[15], 
            header17: skeleton.joints[16], 
            header18: skeleton.joints[17], 
            header19: skeleton.joints[18], 
            header20: skeleton.joints[19], 
            header21: skeleton.joints[20], 
            header22: skeleton.joints[21], 
            header23: skeleton.joints[22], 
            header24: skeleton.joints[23], 
            header25: skeleton.joints[24], 
            header26: skeleton.joints[25], 
            header27: skeleton.joints[26],
            header28: skeleton.joints[27], 
            header29: skeleton.joints[28], 
            header30: skeleton.joints[29], 
            header31: skeleton.joints[30], 
            header32: skeleton.joints[31]
        }); */

        //Test writing out a single joints' fields
        //For HEAD (joint index 26)
        this.#writer.write({
            header1: skeleton.joints[26].cameraX, 
            header2: skeleton.joints[26].cameraY,
            header3: skeleton.joints[26].cameraZ, 
            header4: skeleton.joints[26].orientationX, 
            header5: skeleton.joints[26].orientationY, 
            header6: skeleton.joints[26].orientationZ, 
            header7: skeleton.joints[26].orientationW,
            header9: skeleton.joints[26].colorX, 
            header8: skeleton.joints[26].colorY, 
            header10: skeleton.joints[26].depthX, 
            header11: skeleton.joints[26].depthY, 
            header12: skeleton.joints[26].confidence,
            header13: d.getMinutes(),
            header14: d.getSeconds(),
            header15: d.getMilliseconds(),
            header16: this.getElapsedTime()
        });
        

    } //End of write to file function


    /* Close the writer and save the file */
    closeWrittenFile() {
        this.#writer.end();

        if (!this.#firstStart) {
            //stopwatch is running, stop it.
            this.timerStop();
        }

    }


    /* Initialize the CSV file with the proper header */
    startNewFile() {
        this.#created = true;  //The file with headers has been created.
        var d = new Date();
        //year-month-day_hour-minute-second
        this.#fileName = './' + d.getFullYear() + '-' + (d.getMonth() + 1) + "-"
                         + d.getDate() + "_" + d.getHours() + "-" + 
                         d.getMinutes() + "-" + d.getSeconds() + ".csv";

        //In the future, allow changes to header names
        this.#writer = new csvWriter({ sendHeaders: false}); 
        this.#writer.pipe(fs.createWriteStream(this.#fileName));
        this.#writer.write({
            header1: "Head X", 
            header2: "Head Y",             
            header3: "Head Z", 
            header4: "Head Ornt X", 
            header5: "Head Ornt Y", 
            header6: "Head Ornt Z", 
            header7: "Head Ornt W",             
            header8: "Head Color X", 
            header9: "Head Color Y", 
            header10: "Head Depth X", 
            header11: "Head Depth Y",  
            header12: "Head Conf",
            header13: "Minutes",
            header14: "Seconds",
            header15: "Milliseconds",
            header16: "Elapsed Time"
        });
        this.closeWrittenFile();
    }


    /* Timer function for starting timer */
    timerStart() {
        if (this.#created) {
            //this.#stopwatch.start();  //Start running state
        } else {
            console.log("The CSV file has not yet been instantiated.");
        }

    }  //End of timerToggle


    /* Timer function for stopping timer */
    timerStop() {
        if (this.#created) {
            //this.#stopwatch.stop();  //Stop running state
        } else {
            console.log("The CSV file has not yet been instantiated.");
        }

    }  //End of timerToggle


    /* Get the current time on the stopwatch */
    getElapsedTime() {
        //return this.#stopwatch.ms / 1000; //div by 1000 to make it seconds !ms
        return 0;
    }


}  //End of JointWriter Class



//Joint class from kinect-azure for reference when writing data.
/*
typedef struct _JSJoint
{
	int index = 0;
	
	float cameraX = 0;
	float cameraY = 0;
	float cameraZ = 0;
	//
	float orientationX = 0;
	float orientationY = 0;
	float orientationZ = 0;
	float orientationW = 0;
	//
	float colorX = 0;
	float colorY = 0;
	//
	float depthX = 0;
	float depthY = 0;
	//
	int confidence = 0;
} JSJoint;
*/



//Joint Identification from the Azure Kinect Body Tracking SDK
//Indices 0-31 are the body joints and index 32 (if taken directly from sdk) is
//the amount of joints.
/*
 typedef enum
 {
     K4ABT_JOINT_PELVIS = 0,
     K4ABT_JOINT_SPINE_NAVEL,
     K4ABT_JOINT_SPINE_CHEST,
     K4ABT_JOINT_NECK,
     K4ABT_JOINT_CLAVICLE_LEFT,
     K4ABT_JOINT_SHOULDER_LEFT,
     K4ABT_JOINT_ELBOW_LEFT,
     K4ABT_JOINT_WRIST_LEFT,
     K4ABT_JOINT_HAND_LEFT,
     K4ABT_JOINT_HANDTIP_LEFT,
     K4ABT_JOINT_THUMB_LEFT,
     K4ABT_JOINT_CLAVICLE_RIGHT,
     K4ABT_JOINT_SHOULDER_RIGHT,
     K4ABT_JOINT_ELBOW_RIGHT,
     K4ABT_JOINT_WRIST_RIGHT,
     K4ABT_JOINT_HAND_RIGHT,
     K4ABT_JOINT_HANDTIP_RIGHT,
     K4ABT_JOINT_THUMB_RIGHT,
     K4ABT_JOINT_HIP_LEFT,
     K4ABT_JOINT_KNEE_LEFT,
     K4ABT_JOINT_ANKLE_LEFT,
     K4ABT_JOINT_FOOT_LEFT,
     K4ABT_JOINT_HIP_RIGHT,
     K4ABT_JOINT_KNEE_RIGHT,
     K4ABT_JOINT_ANKLE_RIGHT,
     K4ABT_JOINT_FOOT_RIGHT,
     K4ABT_JOINT_HEAD,
     K4ABT_JOINT_NOSE,
     K4ABT_JOINT_EYE_LEFT,
     K4ABT_JOINT_EAR_LEFT,
     K4ABT_JOINT_EYE_RIGHT,
     K4ABT_JOINT_EAR_RIGHT,
     K4ABT_JOINT_COUNT
 } k4abt_joint_id_t;

 */