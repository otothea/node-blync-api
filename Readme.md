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
    }

### API Docs:

Authenticate (only needed if config.auth = true)

    POST http://localhost:8000/auth

    @param string username : required
    @param string password : required

Unauthenticate (only needed if config.auth = true

    DELETE http://localhost:8000/auth

Update Status (auth required if config.auth = true)

    POST http://localhost:8000/status/:status

    @param string status : required
    @param int    device : optional (for use with multiple blync devices) defaults to 0

    status = "available" | "busy" | "nodisturb" | "away" | "offline" | "rave" | "police" | "traffic"
