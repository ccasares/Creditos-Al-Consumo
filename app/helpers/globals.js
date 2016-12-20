module.exports = function() {

  // Global variables
  global.VERSION        = 'v2.1.0';
  global.DEBUG          = true;
  global.DATETIMEFORMAT = 'DD/MM/YYYY HH:mm:ss.SSS';

  global.SUCCESS        = 0;
  global.ERROR          = -1;
  global.TIMEOUT        = -2;

  // Hosts
  global.config = {
                    apex: {
                      hostname: 'oc-129-152-131-102.compute.oraclecloud.com',
                      port: 9997,
                      URI: '/apex/pdb1/quickbank/{service}/setup/{demozone}'
                    },
                    servers: {
                      IP: 'localhost',
                      URI: '/helpers',
                      ws: {
                        port: 8222,
                        natPort: 8222,
                        contextRoot: '/CreatePDFSoap'
                      },
                      rest: {
                        port: 8223,
                        natPort: 8223,
                        contextRoot: '/restwrapper'
                      }
                    }
                  };

}
