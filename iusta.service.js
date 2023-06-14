const randomWait = async (ctx) => {
  const ms = ctx.params.ms;
  const taskId = ctx.params.taskId;
  const duration = Math.random() * ms * taskId;
  await new Promise((r) => setTimeout(r, duration));
  return `${taskId} waited for ${duration} ms`;
};

module.exports = {
  name: "queue_service",
  settings: {
    nodeID: `node-${Math.floor(Math.random() * (999 - 100 + 1) + 100)}`,
  },
  transporter: "MQTT",
  actions: {
    slow_task(ctx) {
      this.logger.info(
        `${this.settings.nodeID} executing ${ctx.params.taskId}`
      );
      return randomWait(ctx);
    },
    blocking_task(ctx) {
      this.logger.info(
        `${this.settings.nodeID} executing ${ctx.params.taskId}`
      );
      const ms = ctx.params.ms;
      const taskId = ctx.params.taskId;
      const duration = Math.random() * ms * taskId;

      var waitTill = new Date(new Date().getTime() + duration);
      while (waitTill > new Date()) {}
      return `${taskId} waited for ${duration} ms`;
    },
  },
  async stopped() {
    try {
      await new Promise(resolve =>
        this.settings.server.close(() => {
          resolve;
        })
      );
    } catch (e) {
      this.logger.warn("server might not have stopped.");
      this.logger.warn(e.message);
    }
  },
};
