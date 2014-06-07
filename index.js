/*
 * a very simple node netdisk program using socket io and connect
 * author: kate.sf
*/

// socket app part

var io = require('socket.io');
var fs = require('fs');

var Result = {
  SUCCESS: function (msg) { 
    return JSON.stringify({Status: 0, msg: msg});
  },
  FAILED: function (msg) {
    return JSON.stringify({Status: 500, msg: msg});
  }
};

var ws = io.listen(8089, function () {
  console.log("Web Socket Running at port 8089");
});

ws.on('connection', function (client) {
  var dir = '/userdisk/tmp_upload/';
  var currentFile = null;
  client.on('fileData', function (data) {
    var fileName = data.name,
      status = data.status,
      dataBuffer = new Buffer(data.fileData, 'binary'),
      subpath = data.path
      tempName = client.id;

    if (data.password != '34a07c69d7bf6aeba21127e1ca682c35') {
      return client.emit('result', Result.FAILED('error password.'));
    }

    if (currentFile === null) {
      currentFile = fileName;
    };

    if (currentFile === fileName) {
      fs.appendFileSync(dir + tempName, dataBuffer);
      if (status === "done") {
        var exists = fs.existsSync(dir + fileName);
        if (exists) {
          fileName = tempName + "_" + new Date().getTime() + "_" + fileName;
        }
        fs.renameSync(dir + tempName, '/userdisk' + decodeURIComponent(subpath) + '/' + fileName);
        currentFile = null;
      }
      client.emit('result', Result.SUCCESS('ok'));
    } else {
      var exists = fs.existsSync(dir + tempName);
      if (exists) {
        fs.unlinkSync(dir + tempName);
      }
      client.emit('result', Result.FAILED('error submit.'));
    }
  });
})

// web app part  
var connect = require('connect');
var app = connect();
var http = require('http');
var server = http.createServer(app);

var USERNAME = 'user';
var PASSWORD = 'pass';
var port = 8088;

app.use('/data', function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});
app.use(connect.logger());
app.use('/data', connect.basicAuth(USERNAME, PASSWORD));
app.use('/data', connect.static('/userdisk/data'));
app.use('/data', connect.directory('/userdisk/data', {template: './directory.html'}));  
app.use('/', function (req,res,next) {
  res.end('Hello World from node.js on my xiaomi router\n');
});

server.listen(port, function () {
  console.log("Web Page Running at port 8088");
});  
  