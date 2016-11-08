module.exports = function() {

  var util  = require('util')
    , https = require('https')
    , rest  = require('restler')
    , misc  = require('../../app/helpers/misc')()
    , gse   = require('../../app/helpers/gse')()
  ;

  onRestRequest = function(req, res) {

/**
{
	"dni": {
		"documento": {
			"numero": "23456789-S",
			"idesp": "AJJ1115838",
			"valido": "24 12 2020"
		},
		"datosPersonales": {
			"nombre": "CARLOS CASARES ORDOYO",
			"sexo": "M",
			"nacionalidad": "ESP",
			"fechaNacimiento": "19 03 1971",
			"hijode": "ANGEL / MARIA JESUS"

		},
		"nacimiento": {
			"ciudad": "GETXO",
			"provincia": "VIZCAYA"
		},
		"domicilio": {
			"direccion": "C. BLAH BLAH 21",
			"ciudad": "MADRID",
			"provincia": "MADRID"
		}
	},
	"prestamo": {
		"cantidad": 1234.50,
		"periodo": 12
	}
}
**/

    // Set content-type
    res.contentType('application/json');
    misc.debug("[REST] Incoming request: " + JSON.stringify(req.body));

    var jsonRequest = req.body;
    gse.getCurrentCredential('pcs','MADRID').then( function(setup) {
      launchProcess(setup, jsonRequest, (code, processId) => {
        var responseMsg = '';
        if ( code === 200) {
          responseMsg = JSON.stringify({result: SUCCESS, detail: "Request processed successfully. Process Id: " + processId});
        } else {
          responseMsg = JSON.stringify({result: ERROR, detail: "Error launching the process: " + code});
        }
        misc.debug("[REST] Sending response: " + responseMsg);
        res.send(responseMsg);
      });
    }).catch( function (err) {
      misc.error("Unable to invoke process. " + err);
      responseMsg = JSON.stringify({result: ERROR, detail: "Error launching the process. " + err});
      res.send(responseMsg);
    });
  };

  function launchProcess(setup, request, callback) {

    const PROTOCOL = 'https://';
    const PCSHOST = setup.hostname;
    const credential = new Buffer(setup.adminuser + ':' + setup.password).toString('base64');
    const processAPI = '/bpm/api/3.0/processes';

    const partition = 'default';
    const projectName = 'Micro_Loan_Approval_Request';
    const version = '1.0';
    const processName = 'LoanRequest';
    const serviceName = 'LoanRequest.service';
    const operation = 'start';

    var payload =  {
      processDefId: partition + '~' + projectName + '!' + version + '~' + processName,
      serviceName: serviceName,
      operation: operation,
      params: {
        loanRequest: ''
      }
    }

    var xmlParams =
      '<loanRequest xmlns="http://www.oracle.com/alten">' +
      '  <dni>' +
      '     <documento>' +
      '        <idesp>##IDESP##</idesp>' +
      '        <numero>##NUMERO##</numero>' +
      '        <valido>##VALIDO##</valido>' +
      '     </documento>' +
      '     <datosPersonales>' +
      '        <fechaNacimiento>##FECHANACIMIENTO##</fechaNacimiento>' +
      '        <hijode>##HIJODE##</hijode>' +
      '        <nacionalidad>##NACIONALIDAD##</nacionalidad>' +
      '        <nombre>##NOMBRE##</nombre>' +
      '        <sexo>##SEXO##</sexo>' +
      '     </datosPersonales>' +
      '     <domicilio>' +
      '        <ciudad>##CIUDAD##</ciudad>' +
      '        <direccion>##DIRECCION##</direccion>' +
      '        <provincia>##PROVINCIA##</provincia>' +
      '     </domicilio>' +
      '     <nacimiento>' +
      '        <ciudad>##CIUDADNACIMIENTO##</ciudad>' +
      '        <provincia>##PROVINCIANACIMIENTO##</provincia>' +
      '     </nacimiento>' +
      '  </dni>' +
      '  <prestamo>' +
      '     <cantidad>##CANTIDAD##</cantidad>' +
      '     <periodo>##PERIODO##</periodo>' +
      '  </prestamo>' +
      '</loanRequest>'

    xmlParams = xmlParams.replace('##IDESP##', request.dni.documento.idesp);
    xmlParams = xmlParams.replace('##NUMERO##', request.dni.documento.numero);
    xmlParams = xmlParams.replace('##VALIDO##', request.dni.documento.valido);
    xmlParams = xmlParams.replace('##FECHANACIMIENTO##', request.dni.datosPersonales.fechaNacimiento);
    xmlParams = xmlParams.replace('##HIJODE##', request.dni.datosPersonales.hijode);
    xmlParams = xmlParams.replace('##NACIONALIDAD##', request.dni.datosPersonales.nacionalidad);
    xmlParams = xmlParams.replace('##NOMBRE##', request.dni.datosPersonales.nombre);
    xmlParams = xmlParams.replace('##SEXO##', request.dni.datosPersonales.sexo);
    xmlParams = xmlParams.replace('##CIUDAD##', request.dni.domicilio.ciudad);
    xmlParams = xmlParams.replace('##DIRECCION##', request.dni.domicilio.direccion);
    xmlParams = xmlParams.replace('##PROVINCIA##', request.dni.domicilio.provincia);
    xmlParams = xmlParams.replace('##CIUDADNACIMIENTO##', request.dni.nacimiento.ciudad);
    xmlParams = xmlParams.replace('##PROVINCIANACIMIENTO##', request.dni.nacimiento.provincia);
    xmlParams = xmlParams.replace('##CANTIDAD##', request.prestamo.cantidad);
    xmlParams = xmlParams.replace('##PERIODO##', request.prestamo.periodo);

    payload.params.loanRequest = xmlParams;

//    misc.debug(xmlParams);

    console.log(payload);

    var request = https.request({
      host : PCSHOST,
      port : 443,
      path : processAPI,
      method : 'POST',
      headers : {
        'Authorization': 'Basic ' + credential,
        'Content-Type': 'application/json'
      }
    }, (response) => {
        var data = '';
        response.on('data', (chunk) => {
          data += chunk.toString();
        });
        response.on('end', () => {
          var processId = undefined;
          if ( response.statusCode === 200 || response.statusCode === 201) {
            jsonData = JSON.parse(data);
            processId = jsonData.processId;
            misc.debug("Process invoked successfully. Id: " + processId);
//            misc.debug(data);
          } else {
            misc.error("[" + response.statusCode + "]: " + data);
          }
          callback(response.statusCode, processId);
        });
    });
    request.write(JSON.stringify(payload));
    request.end();
  };

}
