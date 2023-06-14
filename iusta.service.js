const randomWait = async (ctx) => {
  const ms = ctx.params.ms;
  const taskId = ctx.params.taskId;
  const duration = Math.random() * ms * taskId;
  await new Promise((r) => setTimeout(r, duration));
  return `${taskId} waited for ${duration} ms`;
};

module.exports = {
  name: "queue_service",
  settings: {},
  transporter: "mqtt://mqtt-server:1883",
  actions: {
    slow_task(ctx) {
      return randomWait(ctx);
    },
  },
  async stopped() {
    try {
      await new Promise((resolve) =>
        this.settings.server.close(() => {
          resolve();
        })
      );
    } catch (e) {
      this.logger.warn("server might not have stopped.");
      this.logger.warn(e.message);
    }
  },
};
