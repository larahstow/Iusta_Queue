//you can run this by calling 
// $node Iusta_broker.js 

const { ServiceBroker } = require("moleculer");
const mqtt = require("mqtt");

const concurrency = 10;
let brokers = [];

randomWait = async (ctx) => {
  const ms = ctx.params.ms;
  const taskId = ctx.params.taskId;
  const duration = Math.random() * ms * taskId;
  await new Promise((r) => setTimeout(r, duration));
  return `${taskId} waited for ${duration} ms`;
};


//Make and return a broker
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

//Make a bunch of workers by launching brokers
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
  for (let i = 0; i < 100; i++) {
    //if ms is too high and too many tasks, tasks*ms could hit timeouts...
    Queue.push({ taskId: i, ms: 150 });
  }

  //assign task function for an idle broker
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
          //put the finished broker back in the idle queue
          idleBrokers.push(focusBroker);
          //assign task again
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

  //assign tasks to all the brokers
  for (let i = 0; i < brokers.length; i++) {
    assignTask(Queue, idleBrokers);
  }
};


main()