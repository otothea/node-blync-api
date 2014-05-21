API to control a blync device
===

### API Docs:

Authenticate:

  POST http://localhost:8000/auth

  @param string username : required
  @param string password : required

Unauthenticate:

  DELETE http://localhost:8000/auth

Update Status:

  POST http://localhost:8000/status/:status

  @param string status : required
  @param int    device : optional (for use with multiple blync devices) defaults to 0

  status = "available" | "busy" | "nodisturb" | "away" | "offline" | "rave" | "police" | "traffic"
