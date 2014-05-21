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

  // Declare the device
  var device;

  // Function to set a color
  var setColor = function(color) {
    device.setColor(color);
  };

  // Declare current interval
  var currentInterval;

  // Clear the current interval
  var clearCurrentInterval = function() {
    clearInterval(currentInterval);
  };

  // Callback for skype notifications
  var handleSkypeNotification = function(body) {
    body = body.split(' ');
    var type = body[0];
    var status = body[1];

    switch(status) {
      case 'DND':
        setColor(COLORS.MAGENTA);
        break;
      case 'AWAY':
        setColor(COLORS.YELLOW);
        break;
      case 'INVISIBLE':
        setColor(COLORS.OFF);
        break;
      case 'OFFLINE':
        setColor(COLORS.OFF);
        break;
      default:
        setColor(COLORS.GREEN);
        break;
    };
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
    device = devices[deviceIndex];

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
      setColor(color);
      currentInterval = setInterval(function() {
        setColor(color);
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
      setColor(i);
      currentInterval = setInterval(function() {
        setColor(i);
        i++;
        if (i == 255) i = 0;
      }, 1);
    }
    // If 'traffic' status
    // rotate red yellow green
    else if (status == STATUSES.TRAFFIC) {
      clearCurrentInterval();
      var i = 0;
      setColor(COLORS.RED);
      currentInterval = setInterval(function() {
        i++;
        if (i == 1) {
          setColor(COLORS.RED);
        }
        if (i == 10) {
          setColor(COLORS.GREEN);
        }
        if (i == 17) {
          setColor(COLORS.YELLOW);
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
    
    // Get the device
    device = devices[deviceIndex];

    skyper.desktop.on('notification', handleSkypeNotification);

    res.send('Success', 200);
  });

  // Stop Listening Skype
  app.delete('/skype', checkAuth, checkDeviceCount, function(req, res) {
    skyper.desktop.removeListener('notification', handleSkypeNotification);
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
