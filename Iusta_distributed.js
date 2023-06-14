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
        ["./node_modules/moleculer/bin/moleculer-runner.js", 
        "--repl",
        "iusta.service.js"
      ],
        {
          stdio: ["inherit", "inherit", "inherit"],
        }
      )
    );
  }
  console.log("remote brokers created");
  //make a local broker to interact with our cluster

  localBroker.loadService("./iusta.service");

  // Start broker
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
      setTimeout((localBroker) => {
        localBroker.call("iusta_queue.slow_task", task).then((res) => {
          console.log(`${res}`);
        });
        resolve();
      }, task.ms);
    });
  }
};

const protocol = "mqtt";
const host = "broker.emqx.io";
const port = "1883";
const clientId = `mqtt_main`;
const connectUrl = `${protocol}://${host}:${port}`;

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});

console.log("testing MQTT connection:");
client.on("connect", () => {
  console.log("Connected");
  client.end(false, {}, () => {
    console.log("MQTT test complete, client disconnected");
    main();
  });
});
