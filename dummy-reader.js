
var EventEmitter = require('events');
var SerialPort = require('serialport');
var net        = require('net');

const ACK_BUFFER = new Buffer([6]);
const ENQ = 5;
const STX = 2;
const ETX = 3;
const LF = 10;
const CR = 13;
const EOT = 4;


class DummyReader extends EventEmitter {

  constructor() {
    super();
  

   this.server = null;
  
   let self = this;
   this.data = null;
   this.emit = null;
 
  }

  initiate(portString) {
    Object.assign(this, { portString });

    this.transmission = [];
    this.statement = null;

    this.port = new SerialPort(portString, {
      baudRate: 38400,
      autoOpen: false
    });

    this.port.on('open', _ => this.__handleOpen());

    this.port.on('error', err => this.__handleError(err));

    this.port.open(err => {
      if (err) {
        this.__handleError(err, 'Error opening port:');
      }
    });

    this.port.on('data', data => this.__handleData(data));
  } 



  initiateTCP(portString) {


    Object.assign(this, { portString });
    this.transmission = [];
    this.statement = null;
    var server = net.createServer();    
    server.on('connection', this.handleConnection);
    server.listen(portString, function() {    
      console.log('server listening to %j', server.address());  
    });

}

 handleConnection(conn) {    

  var remotetAddress = conn.remoteAddress + ':' + conn.remotePort;  
console.log('new client connection from %s', conn.remoteAddress);
  conn.setEncoding('ascii');
  conn.on('data', __handleData);  
  conn.once('close', onConnClose);  
  conn.on('error', __error);
  function onConnData(d) {  
    console.log('connection data from %s: %j', conn.remoteAddress, d);  
    conn.write(d.toUpperCase());  
  }
  function onConnClose() {  
    console.log('connection from %s closed', conn.remoteAddress);  
  }
  function onConnError(err) {  
    console.log('Connection %s error: %s', conn.remoteAddress, err.message);  
  }  


 function __log(...data) {
    data.unshift('Dummy>');
    conn.emit('log', ...data);
  }

 function __error(err) {
  console.log('Connection %s error: %s', conn.remoteAddress, err.message);  

  conn.emit('error', err);
  }

 function __parseError(err) {
  console.log('Parse-Error: '+err);  
    conn.emit('parse-error', err);
  }

  function __handleOpen() {
    this.__log('opened on', this.portString);
    conn.emit('open');
  }

 function __handleError(err, prefix = 'error:') {
    conn.__log(prefix, err.message);
    conn.__error(err);
  }

function __handleData(data) {

  

   // let str = data.toString('ascii');
    let str = data.toString('ascii');
    console.log("HANDLEDATA: "+str);

    if (str.length === 0) return;

    if (str.charCodeAt(0) === ENQ) {
      conn.write(ACK_BUFFER);

    } else if (str.charCodeAt(0) === EOT) {
      console.log("TEST");
      console.log('this.transmission', this.transmission);
      conn.emit('data', this.transmission);
      conn.__log('transmission: \n', this.summarizeTransmission(this.transmission));
      this.transmission = [];

    } else {
      for (let char of str.split('')) {
    console.log(char, char.charCodeAt(0));

        if (char.charCodeAt(0) === STX) {
          this.statement = {
            hasStarted: false,
            hasEnded: false,
            dataMessage: '',
            checksum: ''
          }
          this.statement.hasStarted = true;
          console.log(this.statement.hasStarted);
        } else if (char.charCodeAt(0) === ETX) {
          if (!this.statement.hasStarted) {
            __parseError("this.statement ended before it was started.");
            return;
          }
          this.statement.hasEnded = true;
          console.log("StatementHasEnded: "+this.statement.hasEnded);

        } else if (char.charCodeAt(0) === LF) {
          if (!this.statement.hasStarted) {
            __parseError("LF before this.statement was started.");
            return;
          }
          if (!this.statement.hasEnded) {
            __parseError("LF before this.statement was ended.");
            return;
          }
          console.log("PUSH!");
          conn.write("PUSH");
          console.log(this.transmission)
          this.transmission.push(this.statement);
       conn.write(ACK_BUFFER);


        } else {
          /** 
          if (this.statement,hasStarted) {
              __parseError('Unkown character received before this.statement was started, ${char}, ${char.charCodeAt()}');
            return;
          }*/
          if (char.charCodeAt(0) !== CR) {
            if (!this.statement.hasEnded) {
              this.statement.dataMessage += char;
            } else {
              this.statement.checksum += char;
            }
          }
        }
      }

    }
  }
  }

  summarizeTransmission(transmission) {
    let text = '';
    for (let statement of transmission) {
      let dataMessage = statement.dataMessage;
      if (dataMessage.length > 0) {
        dataMessage = dataMessage.substr(1, dataMessage.length);
      }
      text += dataMessage + '\n';
    }
    return text;
  }





















}

exports.DummyReader = DummyReader;