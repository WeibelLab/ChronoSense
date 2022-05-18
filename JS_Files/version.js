var package_json = require("../package.json")
var local_version = "v"+package_json.version;
var http = require('https');
// Used to open an external link
const shell = require('electron').shell;

//The url we want is: 'https://api.github.com/repos/WeibelLab/ChronoSense/releases/latest'
var options = {
    method: 'GET',
    host: 'api.github.com',
    path: '/repos/WeibelLab/ChronoSense/releases/latest',
    // User Agent request
    headers: {
        'user-agent': 'node.js'
    }
};

var callback = function(response) {
    let str = '';
    let parsed_json = '';

  //append data on page into str
    response.on('data', function (chunk) {
        str += chunk;
    });

    //the whole response has been received, so we just print it out here
    response.on('end', function () {
        // Convert data from page into a parsed json
        parsed_json = JSON.parse(str);
        if (parsed_json.tag_name != local_version) {
            if(window.confirm('A newer version of ChronoSense is available. Click OK to open the download page.')) {
                // Redirects users to latest version of ChronoSense via external browser
                shell.openExternal('https://github.com/WeibelLab/ChronoSense/releases/latest')

            }
        }
    });
}

var check = http.request(options, callback).end();

// Used to catch any errors or no internet connection
check.on('error',function(err) {
    console.log(err);
})



