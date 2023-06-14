const { ServiceBroker } = require("moleculer");
const mqtt = require("mqtt");

const concurrency = 1;
let brokers = [];

randomWait = async (ctx) => {
  const ms = ctx.params.ms;
  const taskId = ctx.params.taskId;
  const duration = Math.random() * ms * taskId;
  await new Promise((r) => setTimeout(r, duration));
  return `${taskId} waited for ${duration} ms`;
};

const makeBrokerAsync = (index) => {
  let broker = new ServiceBroker();

  //Mixing camel and snake_case for broker things
  broker.createService({
    name: "queue_service",
    actions: {
      slow_task(ctx) {
        return randomWait(ctx);
      },
    },
  });

  return new Promise((resolve) => {
    broker.start().then(() => {
      console.log(`broker-worker ${index} started`);
      resolve(broker);
    });
  });
};

async function makeWorkers(concurrency) {
  for (let i = 0; i < concurrency; i++) {
    brokers.push(await makeBrokerAsync(i));
  }
  console.log("brokers started");
}

const main = async () => {
  await makeWorkers(concurrency);
  let Queue = [];

  //create a record of idle brokers
  //technically redundant because we in practice we would load-balance the brokers
  let idleBrokers = [];
  let errorBrokers = [];
  brokers.forEach((broker) => {
    idleBrokers.push(broker);
  });
  console.log(`idle brokers registered: x${idleBrokers.length}`);

  //Make a bunch of tasks
  for (let i = 0; i < 10; i++) {
    //if ms is too high and too many tasks*ms can hit timeouts...
    Queue.push({ taskId: i, ms: 150 });
  }

  const assignTask = (Queue, idleBrokers) => {
    if (idleBrokers.length > 0 && Queue.length > 0) {
      //assign task to first broker, removing it from the idle array
      const focusBroker = idleBrokers.shift();
      let activeJob = Queue.shift();
      console.log(
        `${activeJob.taskId} started, Queue length ${Queue.length}, idle brokers: ${idleBrokers.length}`
      );
      focusBroker
        .call("queue_service.slow_task", activeJob)
        .then((res) => {
          console.log(`${res}`);
          idleBrokers.push(focusBroker);
          assignTask(Queue, idleBrokers);
        })
        .catch((err) => {
          console.log(`Error occured! ${err.message}`);
          errorBrokers.push(focusBroker);
        });
    } else {
      console.log(`Queue empty. Idle Brokers: ${idleBrokers.length} `);
    }
  };

  for (let i = 0; i < brokers.length; i++) {
    assignTask(Queue, idleBrokers);
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
  username: "emqx",
  password: "public",
  reconnectPeriod: 1000,
});

console.log('testing MQTT connection:')
client.on("connect", () => {
  console.log("Connected");
  client.end(false, {}, () => {
    console.log("client disconnected");
    main()
  });
  
});


// main();
