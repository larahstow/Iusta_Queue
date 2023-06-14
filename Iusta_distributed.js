const { ServiceBroker } = require("moleculer");
const { spawn } = require("child_process");
const mqtt = require("mqtt");

const concurrency = 10;
let brokerThreads = [];

const localBroker = new ServiceBroker();

//Prepare to spawn instances of iusta.service.js that will communicate with MQTT (localhost, although could also be done remotely)
async function makeWorkers(concurrency) {
  for (let i = 0; i < concurrency; i++) {
    brokerThreads.push(
      spawn(
        "node",
        //["./node_modules/moleculer/bin/moleculer-runner.js", "--repl","iusta.service.js"],
        ['broker_thread.js'],
        {
          stdio: ["inherit", "inherit", "inherit"],
        }
      )
    );
  }
  console.log("remote brokers created");
  //make a local broker to interact with our cluster

  localBroker.loadService("./iusta.service");

  // Start local broker
  await new Promise((resolve) => {
    localBroker.start().then(() => {
      console.log("local broker started");
      resolve();
    });
  });
}

const main = async () => {
  await makeWorkers(concurrency - 1);
  let Queue = [];
  for (let i = 0; i < 100; i++) {
    //if ms is too high and too many tasks*ms can hit timeouts...
    Queue.push({ taskId: i, ms: 150 });
  }
  while (Queue.length > 0) {
    task = Queue.shift();
    await new Promise((resolve) => {
      //don't assign all the tasks too quickly
      setTimeout(() => {
        localBroker.call("queue_service.blocking_task", task).then((res) => {
          console.log(`${res}`);
        });
        resolve();
      },
      25);
    });
  }
};

//I installed mqtt via the following docker container command:
// $ docker run -d --name emqx -p 1883:1883 -p 8083:8083 -p 8084:8084 -p 8883:8883 -p 18083:18083 emqx/emqx:latest

const protocol = "mqtt";
const host = "localhost";
const port = "1883";
const clientId = `mqtt_main`;
const connectUrl = `${protocol}://${host}:${port}`;

//create a test connection to mqtt client to check it's working
const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});

console.log("testing MQTT connection:");
//if the mqtt client connected, start the test
//it seems to connect even with no MQTT server running, but could replace MQTT with Rabbit or Reddis
//Moleculer has drop-in support for a number of communication styles.
//I know Reddis works really well from experience.
client.on("connect", () => {
  console.log("Connected"); 
  client.end(false, {}, () => {
    console.log("MQTT test complete, client disconnected");
    main();
  });
});
