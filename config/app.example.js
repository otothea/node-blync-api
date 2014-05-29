module.exports = {
  hostname:   'localhost',
  port:       '8000',
  auth:        true,        // Set to false to disable authentication requirement
  username:   'changeme',
  password:   'changeme',   // Sha512 Hash of your password http://www.xorbin.com/tools/sha256-hash-calculator
  secret:     'CHANGEME',   // Used for session storage
  skype:       true,        // Set to false if no skype installed
};
