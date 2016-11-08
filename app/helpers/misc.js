module.exports = function() {

  var moment = require('moment')
    ;

  var module = {};

  module.log = function(text) {
    console.log(getNow() + " [INF] - " + text);
  };

  module.error = function(text) {
    console.log(getNow() + " [ERR] - " + text);
  };

  module.debug = function(text) {
    if ( DEBUG) {
      console.log(getNow() + " [DBG] - " + text);
    }
  };

  function getNow() {
    return '[' + moment().format(DATETIMEFORMAT) + ']';
  }

  module.printBanner = function (v) {
    var banner = "Realtime Healthcare - WebSocket Server (Multi) - node.js version - " + v;
    var lines = new Array(banner.length + 1).join( '=' );
    console.log();
    console.log(lines);
    console.log(banner);
    console.log(lines);
    console.log();
  };

  module.usage = function () {
    this.debug("Usage: ws.js [--debug] [--properties <file>]");
  };

  return module;

};
