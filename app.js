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
  console.log('\n\n**********************************************************************************************************\n*\n*');
  console.log('*    Blync API listening on ' + config.hostname + ':' + config.port + '\n*');
  console.log('*    // Authenticate');
  console.log('*    POST http://' + config.hostname + ':' + config.port + '/auth\n*');
  console.log('*    @param string username : required');
  console.log('*    @param string password : required\n*');
  console.log('*    // Unauthenticate');
  console.log('*    DELETE http://' + config.hostname + ':' + config.port + '/auth\n*');
  console.log('*    // Update Status');
  console.log('*    POST http://' + config.hostname + ':' + config.port + '/status/:status\n*');
  console.log('*    @param string status : required');
  console.log('*    @param int    device : optional (for use with multiple blync devices) defaults to 0\n*');
  console.log('*    status = ' + STATUSES_STRING);
  console.log('*\n*\n**********************************************************************************************************\n\n');

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

  // Declare current interval
  var currentInterval;

  // Clear the current interval
  var clearCurrentInterval = function() {
    clearInterval(currentInterval);
  };

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
    
    // Get the device
    var device = devices[deviceIndex];

    // Function to set a color
    var setColor = function(color) {
      device.setColor(color);
    };

    // Function to send next color in interval
    var nextColor = function(color) {
      device.setColor(color);
    };

    // Get the status from the request
    var status = req.param('status', '').toLowerCase();

    // If 'available' status
    if (status == STATUSES.AVAILABLE) {
      clearCurrentInterval();
      setColor(COLORS.GREEN);
    }
    // If 'busy' status
    else if (status == STATUSES.BUSY) {
      clearCurrentInterval();
      setColor(COLORS.RED);
    }
    // If 'away' status
    else if (status == STATUSES.AWAY) {
      clearCurrentInterval();
      setColor(COLORS.YELLOW);
    }
    // If 'nodisturb' status
    else if (status == STATUSES.NODISTURB) {
      clearCurrentInterval();
      setColor(COLORS.MAGENTA);
    }
    // If 'offline' status
    else if (status == STATUSES.OFFLINE) {
      clearCurrentInterval();
      setColor(COLORS.OFF);
    }
    // If 'police' status
    // rotate red/white/blue
    else if (status == STATUSES.POLICE) {
      clearCurrentInterval();
      color = COLORS.RED;
      nextColor(color);
      currentInterval = setInterval(function() {
        nextColor(color);
        if (color == COLORS.RED) color = COLORS.WHITE;
        else if (color == COLORS.WHITE) color = COLORS.BLUE;
        else if (color == COLORS.BLUE) color = COLORS.RED;
      }, 50);
    }
    // If 'rave' status
    // rotate all colors
    // Un Tiss, Un Tiss, Un Tiss...
    else if (status == STATUSES.RAVE) {
      clearCurrentInterval();
      var i = 0;
      nextColor(i);
      currentInterval = setInterval(function() {
        nextColor(i);
        i++;
        if (i == 255) i = 0;
      }, 1);
    }
    // If 'traffic' status
    // rotate red yellow green
    else if (status == STATUSES.TRAFFIC) {
      clearCurrentInterval();
      var i = 0;
      nextColor(COLORS.RED);
      currentInterval = setInterval(function() {
        i++;
        if (i == 1) {
          nextColor(COLORS.RED);
        }
        if (i == 10) {
          nextColor(COLORS.GREEN);
        }
        if (i == 17) {
          nextColor(COLORS.YELLOW);
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

  /*
   *  EVENT HANDLERS
   */

  // Turn all Blyncs off when you exit
  process.on( 'SIGINT', function() {
    for (var i = 0; i < deviceCount; i++) {
      devices[i].turnOff();
    }  
    process.exit(0);
  });
}
