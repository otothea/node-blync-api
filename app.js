/*
 *  APP LEVEL CONSTANTS
 */

// Available statuses string
const STATUSES_STRING = '"available" | "busy" | "nodisturb" | "away" | "offline" | "rave" | "police" | "traffic"';

// Statuses enum
const STATUSES = {
  AVAILABLE: 'available',
  AWAY: 'away',
  NODISTURB: 'nodisturb',
  BUSY: 'busy',
  OFFLINE: 'offline',
  POLICE: 'police',
  RAVE: 'rave',
  TRAFFIC: 'traffic',
};

const COLORS = {
  OFF: 'off',
  WHITE: 'white',
  MAGENTA: 'magenta',
  BLUE: 'blue',
  CYAN: 'cyan',
  GREEN: 'green',
  RED: 'red',
  YELLOW: 'yellow',
};

/*
 *  SETUP APP
 */

// Require blync
var blync = require('blync');
var skyper = require('skyper');

// How many Blyncs are hooked up?
var devices = blync.getDevices();
var deviceCount = devices.length;

// If there are no devices, throw error
if (deviceCount == 0) {
  console.log('\n\n****************************************************************************************************\n*\n*');
  console.log('*    Process Exited. No Devices Found.\n*\n*\n****************************************************************************************************\n\n');
  return;
}

else {
  /*
   *  START SERVER
   */

  // Initialize HTTP Server
  var config = require('./config/app'),
      express = require('express'),
      bodyParser = require('body-parser'),
      cookieParser = require('cookie-parser'),
      session = require('express-session'),
      app = express(),
      http = require('http'),
      server = http.createServer(app);

  // Start Web Server
  server.listen(config.port, config.hostname);
  console.log('\n\n************************************************************************************************\n\n');
  console.log('     Blync API listening on ' + config.hostname + ':' + config.port + '\n');
  console.log('     Documentation: https://github.com/otothea/node-blync-api#api-to-control-a-blync-device');
  console.log('\n\n************************************************************************************************\n\n');

  /*
   *  MIDDLEWARE
   */

  app.use(bodyParser());
  app.use(cookieParser());
  app.use(session({ secret: config.secret, name: 'blync-api-sid' }));

  // Auth check middleware
  function checkAuth(req, res, next) {
    if (config.auth) {
      if ( ! req.session.logged_in) {
        res.send('Unauthorized', 403);
      }
      else {
        next();
      }
    }
    else {
      next();
    }
  }

  // Device count middleware
  function checkDeviceCount(req, res, next) {
    if (deviceCount == 0) {
      res.send('No Devices Found', 404);
    }
    else {
      next();
    }
  }

  /*
   *  SERVER LEVEL VARS
   */

  // Function to set a color
  var setDeviceColor = function(index, color) {
    if (typeof(devices[index]) != 'undefined') {
      devices[index].setColor(color);
    }
  };

  // Declare current interval
  var intervals = [];

  // Clear the current interval
  var clearDeviceInterval = function(index) {
    if (typeof(intervals[index]) != 'undefined') {
      clearInterval(intervals[index]);
    }
  };

  // Devices that should update from skype
  var skypeIndexes = [];

  /*
   *  API CALLS
   */

  // Log in
  app.post('/auth', function(req, res) {
    var post = req.body;
    if (post.username == config.username && post.password == config.password) {
      req.session.logged_in = true;
      res.send('Authenticated', 200);
    }
    else {
      res.send('Invalid Credentials', 403);
    }
  });

  // Log out
  app.delete('/auth', function (req, res) {
    delete req.session.logged_in;
    res.send('', 200);
  });

  // Set a color
  app.post('/status/:status', checkAuth, checkDeviceCount, function(req, res) {
    var post = req.body;

    // Get the device index if exists else 0
    var deviceIndex = post.device || 0;
    
    // Get the status from the request
    var status = req.param('status', '').toLowerCase();

    // If 'available' status
    if (status == STATUSES.AVAILABLE) {
      clearDeviceInterval(deviceIndex);
      setDeviceColor(deviceIndex, COLORS.GREEN);
    }
    // If 'busy' status
    else if (status == STATUSES.BUSY) {
      clearDeviceInterval(deviceIndex);
      setDeviceColor(deviceIndex, COLORS.RED);
    }
    // If 'away' status
    else if (status == STATUSES.AWAY) {
      clearDeviceInterval(deviceIndex);
      setDeviceColor(deviceIndex, COLORS.YELLOW);
    }
    // If 'nodisturb' status
    else if (status == STATUSES.NODISTURB) {
      clearDeviceInterval(deviceIndex);
      setDeviceColor(deviceIndex, COLORS.MAGENTA);
    }
    // If 'offline' status
    else if (status == STATUSES.OFFLINE) {
      clearDeviceInterval(deviceIndex);
      setDeviceColor(deviceIndex, COLORS.OFF);
    }
    // If 'police' status
    // rotate red/white/blue
    else if (status == STATUSES.POLICE) {
      clearDeviceInterval(deviceIndex);
      var color = COLORS.RED;
      setDeviceColor(deviceIndex, color);
      intervals[deviceIndex] = setInterval(function() {
        setDeviceColor(deviceIndex, color);
        if (color == COLORS.RED) color = COLORS.WHITE;
        else if (color == COLORS.WHITE) color = COLORS.BLUE;
        else if (color == COLORS.BLUE) color = COLORS.RED;
      }, 50);
    }
    // If 'rave' status
    // rotate all colors
    // Un Tiss, Un Tiss, Un Tiss...
    else if (status == STATUSES.RAVE) {
      clearDeviceInterval(deviceIndex);
      var i = 0;
      setDeviceColor(deviceIndex, i);
      intervals[deviceIndex] = setInterval(function() {
        setDeviceColor(deviceIndex, i);
        i++;
        if (i == 255) i = 0;
      }, 1);
    }
    // If 'traffic' status
    // rotate red yellow green
    else if (status == STATUSES.TRAFFIC) {
      clearDeviceInterval(deviceIndex);
      var i = 0;
      setDeviceColor(deviceIndex, COLORS.RED);
      intervals[deviceIndex] = setInterval(function() {
        i++;
        if (i == 1) {
          setDeviceColor(deviceIndex, COLORS.RED);
        }
        if (i == 10) {
          setDeviceColor(deviceIndex, COLORS.GREEN);
        }
        if (i == 17) {
          setDeviceColor(deviceIndex, COLORS.YELLOW);
        }
        if (i == 21) {
          i = 0;
        }
      }, 1000);
    }
    // If status not recognized
    else if (status) {
      res.send('Did not recognize status. Recognized statuses: ' + STATUSES_STRING, 404);
    }
    // If no status found
    else {
      res.send('No status found. Recognized statuses: ' + STATUSES_STRING, 404);
    }

    res.send('Success', 200);
  });

  // Listen Skype
  app.post('/skype', checkAuth, checkDeviceCount, function(req, res) {
    var post = req.body;

    // Get the device index if exists else 0
    var deviceIndex = post.device || 0;

    // If it's not already set
    if (skypeIndexes.indexOf(deviceIndex) < 0) {
      // Add to skype index array
      skypeIndexes.push(deviceIndex);
    }

    res.send('Success', 200);
  });

  // Stop Listening Skype
  app.delete('/skype', checkAuth, checkDeviceCount, function(req, res) {
    var post = req.body;

    // Get the device index if exists else 0
    var deviceIndex = post.device || 0;
    
    // If device exists in skype indexes
    var index = skypeIndexes.indexOf(deviceIndex);
    if (index > -1) {
      // Remove from skype index array
      skypeIndexes.splice(index, 1);
    }

    res.send('Success', 200);
  });

  /*
   *  EVENT HANDLERS
   */

  // Start the listener
  skyper.desktop.on('notification', function(body) {
    if (skypeIndexes.length > 0) {
      body = body.split(' ');
      var type = body[0];

      if (type === 'USERSTATUS') {
        var status = body[1];

        var color = COLORS.GREEN;

        // Get color
        switch(status) {
          case 'DND':
            color = COLORS.RED;
            break;
          case 'AWAY':
            color = COLORS.YELLOW;
            break;
          case 'INVISIBLE':
            color = COLORS.OFF;
            break;
          case 'OFFLINE':
            color = COLORS.OFF;
            break;
        };

        // Set color on all registered skype devices
        for (var i = 0, length = skypeIndexes.length; i < length; i++) {
          deviceIndex = skypeIndexes[i];
          setDeviceColor(deviceIndex, color);
        }
      }
    }
  });

  // Turn all Blyncs off when you exit
  process.on( 'SIGINT', function() {
    for (var i = 0; i < deviceCount; i++) {
      devices[i].turnOff();
    }  
    process.exit(0);
  });
}
