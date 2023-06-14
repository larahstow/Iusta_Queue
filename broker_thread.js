//Better, Run service with: node ./node_modules/moleculer/bin/moleculer-runner.js --repl

const http = require('http');

//create a server object:
const server = http.createServer((req, res) => {
  res.write('200 OK'); //write a response to the client
  res.end(); //end the response
})
server.listen(0, ()=>{
    console.log('server listening on port ' + server.address().port)
}); //the server object listens on random port
const {ServiceBroker} = require('moleculer')

// Create broker
var broker = new ServiceBroker();

// Load service
broker.loadService("./iusta.service");
// broker.settings.server = server

// Start broker
broker.start();