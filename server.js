#!/usr/bin/env node

'use strict';

// Module imports
var globals = require('./app/helpers/globals')()
  , express = require('express')
  , http = require('http')
  , getIP = require('external-ip')()
  , bodyParser = require('body-parser')
  , util = require('util')
  , misc = require('./app/helpers/misc')()
  , httpsHandler = require('./app/servers/https')()
  , restHandler = require('./app/servers/rests')()
  , moment = require('moment')
  ;

// Instantiate classes & servers
var appHttp    = express()
  , appRest    = express()
  , routerRest = express.Router()
  , routerHttp = express.Router()
  , restServer = http.createServer(appRest)
  , httpServer = http.createServer(appHttp)
  ;

// ************************************************************************
// Main code STARTS HERE !!
// ************************************************************************

// Main handlers registration - BEGIN
// Main error handler
process.on('uncaughtException', function (err) {
  misc.error("Uncaught Exception: " + err);
  misc.debug("Uncaught Exception: " + err.stack);
});
// Detect CTRL-C
process.on('SIGINT', function() {
  misc.log("Caught interrupt signal");
  misc.log("Exiting gracefully");
  process.exit(2);
});
// Main handlers registration - END

// Get current IP
misc.log("Getting my IP...");
getIP(function (err, ip) {
    if (err) {
        throw err;
    }
    misc.log("My IP: " + ip);
    config.servers.IP = ip;
    // Servers initialization
    // REST server initialization
    appRest.use(bodyParser.urlencoded({ extended: true }));
    appRest.use(bodyParser.json());
    routerRest.post('/', onRestRequest);
    appRest.use(config.servers.URI + config.servers.rest.contextRoot, routerRest);
    restServer.listen(config.servers.rest.port, function() {
      misc.log("REST server running on http://" + config.servers.IP + ":" + config.servers.rest.port + config.servers.URI + config.servers.rest.contextRoot);
    });
    // Web Services server initialization
    appHttp.use(bodyParser.text({ type: 'text/xml' }));
    routerHttp.get(config.servers.ws.contextRoot, onHttpRequest);
    routerHttp.post(config.servers.ws.contextRoot, onHttpRequest);
    appHttp.use(config.servers.URI, routerHttp);
    httpServer.listen(config.servers.ws.port, function() {
      misc.log("HTTP WS server running on http://" + config.servers.IP + ":" + config.servers.ws.port + config.servers.URI + config.servers.ws.contextRoot);
    });
});
