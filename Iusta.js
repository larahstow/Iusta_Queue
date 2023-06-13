const async = require("async");

function Queue(fn, concurrency) {
  this.queue = async.queue(fn, concurrency);

  this.push = (task, callback) => {
    this.queue.push(task, callback);
  };
  this.waitForAll = async () => {
    await this.queue.drain();
  };
  this.pause = () => {
    this.queue.pause();
    return this.queue.paused;
  };
  this.resume = () => {
    this.queue.resume();
    return !this.queue.paused;
  };
  this.onError = (callback) => {
    this.queue.error(callback);
  };
  this.getQueue = () => {
    return [...this.queue];
  };
}

function MPQueue(fn, concurrency) {
    this.queue = async.queue(fn, concurrency);

  this.push = (task, callback) => {
    this.queue.push(task, callback);
  };
  this.waitForAll = async () => {
    await this.queue.drain();
  };
  this.pause = () => {
    this.queue.pause();
    return this.queue.paused;
  };
  this.resume = () => {
    this.queue.resume();
    return !this.queue.paused;
  };
  this.onError = (callback) => {
    this.queue.error(callback);
  };
  this.getQueue = () => {
    return [...this.queue];
  };
}

module.exports = {
  Queue: Queue,
  MPQueue: MPQueue,
};
