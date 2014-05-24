API to control a blync device
===

### Config:

config/app.js:

    {
      hostname:   'localhost',
      port:       '8000',
      auth:        true,
      username:   'changeme',
      password:   'changeme',
      secret:     'CHANGEME',
      skype:       true,
    }

### API Docs:

Authenticate (only needed if config.auth = true)

    POST http://localhost:8000/auth

    @param string username : required
    @param string password : required

Unauthenticate (only needed if config.auth = true)

    DELETE http://localhost:8000/auth

Update Status (auth required if config.auth = true)

    POST http://localhost:8000/status/:status

    @param string status : required
    @param int    device : optional (for use with multiple blync devices) defaults to 0

    status = "available" | "busy" | "nodisturb" | "away" | "offline" | "rave" | "police" | "traffic" | "strobe"

Start Skype Listener (auth required if config.auth = true)

    POST http://localhost:8000/skype

    @param int    device : optional (for use with multiple blync devices) defaults to 0

Stop Skype Listener (auth required if config.auth = true)

    DELETE http://localhost:8000/skype

    @param int    device : optional (for use with multiple blync devices) defaults to 0

### Web GUI

Includes a simple Web GUI to interface with the API

    In your browser:

    http://localhost:8000/login     // authentication form (only needed if config.auth = true)
    http://localhost:8000/          // blync controller
