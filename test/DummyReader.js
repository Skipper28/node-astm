



let { DummyReader } = require('./../dummy-reader');

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
 console.log('transmission:', transmission);
})

machine.initiateTCP('10124');
