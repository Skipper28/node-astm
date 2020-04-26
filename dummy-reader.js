
var EventEmitter = require('events');
var SerialPort = require('serialport');
var net        = require('net');

const ACK_BUFFER = new Buffer.alloc(6);
const ENQ = 5;
const STX = 2;
const ETX = 3;
const LF = 10;
const CR = 13;
const EOT = 4;
const fooHandler = (data) => { this.__handleData(data) };


class DummyReader extends EventEmitter {

  constructor() {
    super();
    const fooHandler = (data) => { this.__handleData(data) };

   this.server = null;
  
   let self = this;
   this.data = null;
 
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
    var server = net.createServer();    
    server.on('connection', this.handleConnection);
    server.listen(9000, function() {    
      console.log('server listening to %j', server.address());  
    });

}

 handleConnection(conn) {    
  var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;  
  console.log('new client connection from %s', remoteAddress);
  conn.setEncoding('ascii');
  conn.on('data', __handleData);  
  conn.once('close', onConnClose);  
  conn.on('error', onConnError);
  function onConnData(d) {  
    console.log('connection data from %s: %j', remoteAddress, d);  
    conn.write(d.toUpperCase());  
  }
  function onConnClose() {  
    console.log('connection from %s closed', remoteAddress);  
  }
  function onConnError(err) {  
    console.log('Connection %s error: %s', remoteAddress, err.message);  
  }  



  

 function __log(...data) {
    data.unshift('Dummy>');
    this.emit('log', ...data);
  }

 function __error(err) {
    this.emit('error', err);
  }

 function __parseError(err) {
    this.emit('parse-error', err);
  }

  function __handleOpen() {
    this.__log('opened on', this.portString);
    this.emit('open');
  }

 function __handleError(err, prefix = 'error:') {
    this.__log(prefix, err.message);
    this.__error(err);
  }

function __handleData(data) {
   // let str = data.toString('ascii');
    let str = data.toString('ascii');
    //console.log("HANDLEDATA: "+data);
    console.log(str.length);
    if (str.length === 0) return;

    if (str.charCodeAt(0) === ENQ) {
      conn.write(ACK_BUFFER);

    } else if (str.charCodeAt(0) === EOT) {
      console.log('this.transmission', this.transmission);
      this.emit('data', this.transmission);
      this.__log('transmission: \n', this.summarizeTransmission(this.transmission));
      this.transmission = [];

    } else {
      for (let char of str.split('')) {
    //   console.log(char, char.charCodeAt(0));

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
            this.__parseError("this.statement ended before it was started.");
            return;
          }
          this.statement.hasEnded = true;

        } else if (char.charCodeAt(0) === LF) {
          if (!this.statement.hasStarted) {
            this.__parseError("LF before this.statement was started.");
            return;
          }
          if (!this.statement.hasEnded) {
            this.__parseError("LF before this.statement was ended.");
            return;
          }
          this.transmission.push(this.statement);
   //       this.port.write(ACK_BUFFER);

        } else {
          if (!this.statement.hasStarted) {
            this.__parseError(`Unkown character received before this.statement was started, ${char}, ${char.charCodeAt()}`);
            return;
          }
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