const { Queue, MPQueue } = require("./Iusta.js");

async function main(ms = 1000) {
  console.log("main features");
  // Create a queue for an async worker function with 3 concurrent workers
  const queue = new Queue(async (x) => {
    const duration = Math.random() * ms * x;
    await new Promise((r) => setTimeout(r, duration));
    console.log(`${x} waited for ${duration} ms`);
  }, 3);
  // Add some data to the queue
  queue.push(10);
  queue.push(9);
  queue.push(8);
  queue.push(7);
  queue.push(6);
  queue.push(5);
  queue.push(4);
  queue.push(3);
  queue.push(2);
  queue.push(1);
  // Wait until all workers are finished
  await queue.waitForAll();
  console.log("All done!");
}

async function additional(ms = 1000) {
  console.log("additional features I");
  // Create a queue for an async worker function with 3 concurrent workers
  const queue = new Queue(async (x) => {
    const duration = Math.random() * ms * x;
    await new Promise((r) => setTimeout(r, duration));
    console.log(`${x} waited for ${duration} ms`);
    return true;
  }, 3);
  // Add some data to the queue
  const onsuccess = (x) => {
    console.log(`${x} succeeded`);
  };
  queue.push(10);
  queue.push(9);
  queue.push(8);
  queue.push(7);
  if (queue.pause()) {
    const pauseTime = ms * 10;
    console.log(`queue paused for ${pauseTime}ms`);
    await new Promise((resolve) => setTimeout(resolve, pauseTime));
    queue.resume();
    console.log("queue resumed");
  } else {
    throw new Error("Queue failed to Pause");
  }

  queue.push(6);
  queue.push(5);
  queue.push(4);
  queue.push(3);
  queue.push(2);
  queue.push(1);
  // Wait until all workers are finished
  await queue.waitForAll();
  console.log("All done!");
}
async function additionalPlus(ms = 1000) {
  console.log("additional features II");
  // Create a queue for an async worker function with 3 concurrent workers
  const queue = new MPQueue(async (x) => {
    const duration = Math.random() * ms * x;
    await new Promise((r) => setTimeout(r, duration));
    console.log(`${x} waited for ${duration} ms`);
    return true;
  }, 3);
  // Add some data to the queue
  const onsuccess = (x) => {
    console.log(`${x} succeeded`);
  };
  queue.push(10);
  queue.push(9);
  queue.push(8);
  queue.push(7);
  if (queue.pause()) {
    const pauseTime = ms * 10;
    console.log(`queue paused for ${pauseTime}ms`);
    await new Promise((resolve) => setTimeout(resolve, pauseTime));
    queue.resume();
    console.log("queue resumed");
  } else {
    throw new Error("Queue failed to Pause");
  }

  queue.push(6);
  queue.push(5);
  queue.push(4);
  queue.push(3);
  queue.push(2);
  queue.push(1);
  // Wait until all workers are finished
  await queue.waitForAll();
  console.log("All done!");
}

await main(150);
await additional(150);
await additionalPlus(150);
