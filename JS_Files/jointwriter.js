/*
 * Description: File used to write Kinect joint data to a CSV file.
 *
 */
const fs = require('fs');
const csvWriter = require('csv-write-stream');
//Check out: https://github.com/maxogden/csv-write-stream
//for detailed instructions on how to use csvWriter

export class JointWriter {
    #writer;
    #fileName;

    constructor() {
        //Create the joint CSV writer with headers for all Joints by default.
        this.#writer = new csvWriter({ headers: ["Joint1", "Joint2",
                            "Joint3", "Joint4", "Joint5", "Joint6", "Joint7",
                            "Joint8", "Joint9", "Joint10", "Joint11", 
                            "Joint12", "Joint13", "Joint14", "Joint15", 
                            "Joint16", "Joint17", "Joint18", "Joint19", 
                            "Joint20", "Joint21", "Joint22", "Joint23", 
                            "Joint24", "Joint25", "Joint26", "Joint27",
                            "Joint28", "Joint29", "Joint30", "Joint31", 
                            "Joint32"]}); 
        //let currentDate = new Date();
        this.#fileName = '../currentYearCurrentMonthCurrentDayCurrentTime.csv';

    }  //End of constructor

    /* Write skeleton joint data to file or append to already created CSV*/
    writeToFile(skeleton) {
        // skeleton.joints[] 0-31 -> joint1-joint32

        //Appends or creates new file
        this.#writer.pipe(fs.createWriteStream(this.#fileName, {flags: 'a'}));
        this.#writer.write({
            Joint1: skeleton.joints[0], 
            Joint2: skeleton.joints[1],
            Joint3: skeleton.joints[2], 
            Joint4: skeleton.joints[3], 
            Joint5: skeleton.joints[4], 
            Joint6: skeleton.joints[5], 
            Joint7: skeleton.joints[6],
            Joint9: skeleton.joints[7], 
            Joint8: skeleton.joints[8], 
            Joint10: skeleton.joints[9], 
            Joint11: skeleton.joints[10], 
            Joint12: skeleton.joints[11], 
            Joint13: skeleton.joints[12], 
            Joint14: skeleton.joints[13], 
            Joint15: skeleton.joints[14], 
            Joint16: skeleton.joints[15], 
            Joint17: skeleton.joints[16], 
            Joint18: skeleton.joints[17], 
            Joint19: skeleton.joints[18], 
            Joint20: skeleton.joints[19], 
            Joint21: skeleton.joints[20], 
            Joint22: skeleton.joints[21], 
            Joint23: skeleton.joints[22], 
            Joint24: skeleton.joints[23], 
            Joint25: skeleton.joints[24], 
            Joint26: skeleton.joints[25], 
            Joint27: skeleton.joints[26],
            Joint28: skeleton.joints[27], 
            Joint29: skeleton.joints[28], 
            Joint30: skeleton.joints[29], 
            Joint31: skeleton.joints[30], 
            Joint32: skeleton.joints[31]
        });


    }








}  //End of JointWriter Class