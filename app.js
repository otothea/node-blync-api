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
   *  CONSTANTS
   */

  // Available statuses string
  const STATUSES_STRING = '"available" | "busy" | "nodisturb" | "away" | "offline" | "rave" | "police" | "traffic" | "strobe"';

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
    STROBE: 'strobe',
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
  console.log('\n\n******************************************************************\n\n');
  console.log('     Blync API listening on ' + config.hostname + ':' + config.port + '\n');
  console.log('     Documentation: https://github.com/otothea/node-blync-api');
  console.log('\n\n******************************************************************\n\n');

  // Set all devices to green to show we have started up successfuly
  for (var i = 0; i < deviceCount; i++) {
    devices[i].setColor(COLORS.GREEN);
  }

  /*
   *  MIDDLEWARE
   */

  app.set('view engine', 'jade');
  app.use(express.static(__dirname + '/views'));
  app.use(bodyParser());
  app.use(cookieParser());
  app.use(session({ secret: config.secret, name: 'blync-api-sid' }));

  // Auth check middleware
  function checkAuth(req, res, next) {
    // If auth is required
    if (config.auth) {
      // If user is NOT logged in
      if ( ! req.session.logged_in) {
        // If POST | PUT | DELETE request
        if (req.method == 'POST' || req.method == 'PUT' || req.method == 'DELETE') {
          // Restful response
          res.send('Unauthorized', 403);
        }
        // If GET request
        else if (req.method == 'GET') {
          // Redirect to login page
          res.redirect('/login');
        }
      }
      // User is authenticated, continue
      else {
        next();
      }
    }
    // No auth needed, continue
    else {
      next();
    }
  }

  /*
   *  SERVER LEVEL VARS
   */

  // Function to set a color
  var setDeviceColor = function(_index, _color) {
    var device = devices[_index];
    if (typeof(device) != 'undefined' && device) {
      device.setColor(_color);
    }
  };

  // Intervals object
  // deviceIndex => interval
  var intervals = {};

  // Clear the current interval
  var clearDeviceInterval = function(_index) {
    var interval = intervals[_index];
    if (typeof(interval) != 'undefined' && interval) {
      clearInterval(interval);
      delete intervals[_index];
    }
  };

  // Devices that should update from skype
  var skypeIndexes = [];

  /*
   *  WEB PAGES
   */

  // Web Login
  app.get('/login', function(req, res) {
    res.render('login', {
      title: 'Login'
    });
  });

  // Web GUI
  app.get('/', checkAuth, function(req, res) {
    res.render('index', {
      title: 'Home',
      deviceCount: deviceCount
    });
  });

  /*
   *  API CALLS
   */

  // Log in
  app.post('/auth', function(req, res) {
    var post = req.body;
    // Username and Password are valid
    if (post.username == config.username && post.password == config.password) {
      req.session.logged_in = true;
      res.send('Authenticated', 200);
    }
    // Invalid attempt
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
  app.post('/status/:status', checkAuth, function(req, res) {
    var post = req.body;

    // Get the device index if exists else 0
    var deviceIndex = post.device || 0;
    
    // Get the status from the request
    var status = req.param('status', '').toLowerCase();

    switch (status) {
      case STATUSES.AVAILABLE:
        clearDeviceInterval(deviceIndex);
        setDeviceColor(deviceIndex, COLORS.GREEN);
        break;

      case STATUSES.BUSY:
        clearDeviceInterval(deviceIndex);
        setDeviceColor(deviceIndex, COLORS.RED);
        break;

      case STATUSES.AWAY:
        clearDeviceInterval(deviceIndex);
        setDeviceColor(deviceIndex, COLORS.YELLOW);
        break;

      case STATUSES.NODISTURB:
        clearDeviceInterval(deviceIndex);
        setDeviceColor(deviceIndex, COLORS.MAGENTA);
        break;

      case STATUSES.OFFLINE:
        clearDeviceInterval(deviceIndex);
        setDeviceColor(deviceIndex, COLORS.OFF);
        break;

      case STATUSES.POLICE:
        clearDeviceInterval(deviceIndex);
        var color = COLORS.RED;
        setDeviceColor(deviceIndex, color);
        intervals[deviceIndex] = setInterval(function() {
          setDeviceColor(deviceIndex, color);
          if (color == COLORS.RED) color = COLORS.WHITE;
          else if (color == COLORS.WHITE) color = COLORS.BLUE;
          else if (color == COLORS.BLUE) color = COLORS.RED;
        }, 50);
        break;

      case STATUSES.RAVE:
        clearDeviceInterval(deviceIndex);
        var i = 0;
        setDeviceColor(deviceIndex, i);
        intervals[deviceIndex] = setInterval(function() {
          setDeviceColor(deviceIndex, i);
          i++;
          if (i == 255) i = 0;
        }, 1);
        break;

      case STATUSES.STROBE:
        clearDeviceInterval(deviceIndex);
        var color = COLORS.WHITE;
        setDeviceColor(deviceIndex, color);
        intervals[deviceIndex] = setInterval(function() {
          setDeviceColor(deviceIndex, color);
          if (color == COLORS.WHITE) color = COLORS.OFF;
          else if (color == COLORS.OFF) color = COLORS.WHITE;
        }, 1);
        break;

      case STATUSES.TRAFFIC:
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
        break;

      default:
        // If there is an unrecognized status
        if (status) {
          res.send('Did not recognize status. Recognized statuses: ' + STATUSES_STRING, 404);
        }
        // If no status found
        else {
          res.send('No status found. Recognized statuses: ' + STATUSES_STRING, 404);
        }
    }

    res.send('Success', 200);
  });

  // Listen Skype
  app.post('/skype', checkAuth, function(req, res) {
    if (skypeFound) {
      var post = req.body;

      // Get the device index if exists else 0
      var deviceIndex = post.device || 0;

      // If it's not already set
      if (skypeIndexes.indexOf(deviceIndex) < 0) {
        // Add to skype index array
        skypeIndexes.push(deviceIndex);
      }

      res.send('Success', 200);
    }

    res.send('No Skype Found', 404);
  });

  // Stop Listening Skype
  app.delete('/skype', checkAuth, function(req, res) {
    if (skypeFound) {
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
    }

    res.send('No Skype Found', 404);
  });

  /*
   *  EVENT HANDLERS
   */

  var skypeFound = true;
  try {
    // Listen for skype desktop notifications
    skyper.desktop.on('notification', function(_body) {
      if (skypeIndexes.length > 0) {
        var body = _body.split(' ');
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
          }

          // Set color on all registered skype devices
          for (var i = 0, length = skypeIndexes.length; i < length; i++) {
            deviceIndex = skypeIndexes[i];
            clearDeviceInterval(deviceIndex);
            setDeviceColor(deviceIndex, color);
          }
        }
      }
    });
  }
  catch (e) {
    skypeFound = false;
  }

  // Turn all Blyncs off when you exit
  process.on( 'SIGINT', function() {
    for (var i = 0; i < deviceCount; i++) {
      devices[i].turnOff();
    }  
    process.exit(0);
  });
}
