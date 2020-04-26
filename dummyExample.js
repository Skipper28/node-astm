
let { DummyReader } = require('./Dummy-Reader');
let { DummyParser } = require('./dummy-parser');

let machine = new DummyReader();


machine.on('log', (...args) => {
  console.log(...args);
});

machine.on('error', (error) => {
  console.log(error);
});

machine.on('parse-error', (error) => {
  console.log(error);
});

machine.on('data', (transmission) => {
  let string = machine.summarizeTransmission(transmission);
  let parser = new HoribaPentra60Parser();
  let results = parser.parse(string);
  console.log(results); // outputs { testResultList, suspectedPathologyList }
})

machine.initiateTCP('10124');


