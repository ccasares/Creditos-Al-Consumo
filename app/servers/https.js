module.exports = function() {

  var util   = require('util')
    , fs     = require('fs')
    , url    = require('url')
    , xmldoc = require('xmldoc')
    , pdf    = require('html-pdf')
    , misc   = require('../../app/helpers/misc')()
    , gse    = require('../../app/helpers/gse')()
    , moment = require('moment')
    , https  = require('https')
  ;

  require("moment-duration-format");

  onHttpRequest = function(req, res) {
    var result = "Request processed successfully";

    if (req.method === 'GET') {
      if (req.query.wsdl !== undefined) {
        // WSDL requested
        var wsdl = 'server.wsdl';
        fs.readFile(wsdl, 'utf8', function (err,data) {
          if (err) {
            res.status(500).send("INTERNAL ERROR");
            return console.log(err);
          }
          // Set current server IP to location
          var hostname = ((req.headers.host === undefined) || (req.headers.host === '')) ? (config.helpers.IP + ':' + config.helpers.natPort) : req.headers.host;
          data = data.replace('##HOSTNAME##', hostname);
          res.type('xml');
          res.status(200).send(data);
        });
      } else {
        res.status(400).send("Bad request");
      }
    } else if (req.method === 'POST') {
      // Actual WS invoked
      const namespace = '';
      var doc = new xmldoc.XmlDocument(req.body);
      var n = doc.childNamed('env:Body').childNamed(namespace + 'CreatePDFAndUpload');

      var jsonRequest = {};

      try {
        jsonRequest = {
          customer: {
            name: n.valueWithPath(namespace + 'customer.' + namespace + 'name'),
            surname: n.valueWithPath(namespace + 'customer.' + namespace + 'surname'),
            DNI: n.valueWithPath(namespace + 'customer.' + namespace + 'DNI'),
          } ,
          loan: {
            amount: n.valueWithPath(namespace + 'loan.' + namespace + 'amount'),
            period: n.valueWithPath(namespace + 'loan.' + namespace + 'period')
          }
        }
      } catch (ex) {
        result = "Invalid request received";
        sendResponse(res, result);
        return;
      }
      // Create PDF
      var pdfFileName = jsonRequest.customer.DNI + '.pdf';
      var html = fs.readFileSync('TemplateSolicitudDePrestamo.html', 'utf8');
      html = html.replace('##NOMBRE##', jsonRequest.customer.name);
      html = html.replace('##DNI##', jsonRequest.customer.DNI);
      html = html.replace('##CANTIDAD##', jsonRequest.loan.amount);
      html = html.replace('##PLAZO##', jsonRequest.loan.period);
      pdf.create(html, { format: 'Letter' }).toFile(pdfFileName, function(err, resp) {
        if (err) {
          misc.error("Error generating PDF: " + err);
          result = "Error generating PDF";
          sendResponse(res, result);
          return;
        }
        misc.debug("PDF created successfully: " + JSON.stringify(resp));
        gse.getCurrentCredential('docs', 'MADRID').then( function(setup) {
          // Upload to DOCS
          uploadToDOCS(setup, pdfFileName, (result) => {
            sendResponse(res, result);
          });
        }).catch( function (err) {
          misc.error("Unable to invoke process. " + err);
          responseMsg = JSON.stringify({result: ERROR, detail: "Error launching the process. " + err});
          sendResponse(res, responseMsg);
        });
      });
    } else {
      res.status(501).send("Method not implemented");
    }
  };

  function uploadToDOCS(setup, filename, callback) {
    const PROTOCOL    = 'https://';
    const DoCSHOST    = setup.hostname;
    const credential  = new Buffer(setup.username + ':' + setup.password).toString('base64');
    const UploadFile  = '/documents/api/1.1/files/data';
    const FOLDER_ID   = 'F54305B0129315851C999E0111451C1FC44E45AEDEE8';
    const delimiter   = '----';
    const boundaryKey = Math.random().toString(16); // random string

    const R = '\r\n';
    const multipart_body = '----' + boundaryKey + R +
                         'Content-Disposition: form-data; name="jsonInputParameters"' + R +
                         R +
                         JSON.stringify({parentID: FOLDER_ID}) + R +
                         '----' + boundaryKey + R +
                         'Content-Disposition: form-data; name="primaryFile"; filename="' + filename + '"' + R +
                         'Content-Type: application/pdf' + R +
                         R;
    const multipart_end = '----' + boundaryKey + '--';

    var request = https.request({
      host : DoCSHOST,
      port : setup.port,
      path : UploadFile,
      method : 'POST',
      headers : {
        'Authorization': 'Basic ' + credential,
        'Content-Type': 'multipart/form-data; boundary=--'+ boundaryKey
      }
    }, (response) => {
        var data = '';
        response.on('data', (chunk) => {
          data += chunk.toString();
        });
        response.on('end', () => {
          if ( response.statusCode === 200 || response.statusCode === 201) {
            misc.debug("File uploaded successfully");
            callback("Request processed successfully");
          } else {
            misc.error("[" + response.statusCode + "]: " + data);
            callback("Error uploading document: " + response.statusCode);
          }
        });
      });

    request.write(multipart_body);

    var f = fs.createReadStream(filename, { bufferSize: 4 * 1024 });
    f.on('open', () => {
      f.pipe(request, { end: false });
    });
    f.on('end', () => {
      request.end(multipart_end);
    });
    f.on('error', (err) => {
      callback("Error reading file: " + err);
    });
  }

  function sendResponse(res, result) {
    // Send WebService response back
    var wsdl = 'server.response.xml';
    fs.readFile(wsdl, 'utf8', function (err,data) {
      if (err) {
        res.status(500).send("INTERNAL ERROR");
        misc.error(err);
        return;
      }
      data = data.replace('##RESPONSE##', result);
      res.setHeader('Content-Type', 'text/xml');
      res.status(200).send(data);
    });
  }
}
