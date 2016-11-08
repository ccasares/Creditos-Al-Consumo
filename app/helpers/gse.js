module.exports = function() {

  var rest = require('restler')
    , misc = require('../../app/helpers/misc')()
  ;

  var module = {};

  module.getCurrentCredential = function (service, demozone) {

    const PROTO = 'http://';

    return new Promise (function (fulfill, reject) {
      misc.debug("[REST] Requesting GSE setup for service " + service + " at demozone " + demozone + "...");
      var URI = config.apex.URI;
      const URL = PROTO + config.apex.hostname + ':' + config.apex.port + URI.replace('{service}', service).replace('{demozone}', demozone);
      rest.get(URL,{timeout: 5000}).on('timeout', function(ms){
        const r = 'Timeout getting setup after ' + ms + ' ms';
        misc.debug("[REST] " + r);
        reject(r);
      }).on('complete', function(data,response) {
        if ( response.statusCode === 200) {
          if ( data.items[0].demozone) {
            misc.debug("[REST] Setup obtained");
            fulfill(data.items[0]);
          } else {
            reject('Setup not returned');
          }
        } else {
          const r = 'Error getting setup: ' + response.statusCode;
          misc.debug("[REST] " + r);
          reject(r);
        }
      });
    });
  }

  return module;

}
