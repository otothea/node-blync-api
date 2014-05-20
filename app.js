//
// Setup App
//

// Require blync
var blync = require('blync');

// How many Blyncs are hooked up?
var devices = blync.getDevices();
var deviceCount = devices.length;

// If there are devices, start the app
if (deviceCount > 0) {
  // Initialize HTTP Server
  var config = require('./config/app'),
      express = require('express'),
      app = express(),
      http = require('http'),
      server = http.createServer(app);

  // Start Web Server
  server.listen(config.port, config.hostname);
  console.log('\n\n****************************************************************************************************\n*\n*\n*    Blync server running. Listening on ' + config.hostname + ':' + config.port + '\n*\n*    To change status POST http://localhost/status/:status\n*\n*    Valid options: "available" | "busy" | "away" | "nodisturb" | "offline" | "rave" | "police"\n*\n*\n****************************************************************************************************\n\n');

  //
  // App Level Vars
  //

  // Declare current interval
  var currentInterval;

  // Clear the current interval
  var clearCurrentInterval = function() {
    clearInterval(currentInterval);
  };

  //
  // API
  //

  // Set a color
  app.get('/status/:status', function(req, res) {
    // Make sure there are devices
    if (deviceCount > 0) {
      // Get the device
      var device = devices[0];

      // Function to set a color
      var setColor = function(color) {
        device.setColor(color);
      };

      // Function to send next color in interval
      var next = function(color) {
        device.setColor(color);
      };

      var status = req.param('status', false);

      //
      // PROCESS ARGUMENT
      //

      // If 'available' status
      if (status == 'available') {
        clearCurrentInterval();
        setColor('green');
      }
      // If 'busy' status
      else if (status == 'busy') {
        clearCurrentInterval();
        setColor('red');
      }
      // If 'away' status
      else if (status == 'away') {
        clearCurrentInterval();
        setColor('yellow');
      }
      // If 'nodisturb' status
      else if (status == 'nodisturb') {
        clearCurrentInterval();
        setColor('magenta');
      }
      // If 'offline' status
      else if (status == 'offline') {
        clearCurrentInterval();
        setColor('off');
      }
      // If 'rave' status
      else if (status == 'rave') {
        clearCurrentInterval();
        var i = 0;
        currentInterval = setInterval(function() {
          next(i);
          i++;
          if (i == 255) i = 0;
        }, 5);
      }
      // If 'police' status
      else if (status == 'police') {
        clearCurrentInterval();
        color = 'red';
        currentInterval = setInterval(function() {
          next(color);
          if (color == 'red') color = 'white';
          else if (color == 'white') color = 'blue';
          else if (color == 'blue') color = 'red';
        }, 50);
      }
      // If status not recognized
      else if (status) {
        res.send('Did not recognize status. Recognized statuses: "available" || "busy" || "nodisturb" || "away" || "offline" || "rave" || "police"', 404);
      }
      // If no status found
      else {
        res.send('No status found. Recognized statuses: "available" || "busy" || "nodisturb" || "away" || "offline" || "rave" || "police"', 404);
      }
    }
    else {
      res.send('No device found.', 404);
    }

    res.send('Success!', 200);
  });

  //
  // Events
  //

  // Turn all Blyncs off when you exit
  process.on( 'SIGINT', function() {
    for (var i = 0; i < deviceCount; i++) {
      devices[i].turnOff();
    }  
    process.exit(0);
  });
}
else {
  console.log('\n\n****************************************************************************************************\n*\n*\n*    Process Exited. No Devices Found.\n*\n*\n****************************************************************************************************\n\n');
}
