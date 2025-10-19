Module.register("MMM-Synology-Download_Station", {
  defaults: {
    host: "localhost",
    port: 5000,
    user: "",
    passwd: "",
    refreshInterval: 10,
    compactMode: false
  },

  start: function () {
    this.tasks = [];
    this.sendSocketNotification("CONFIG", this.config);
    this.getTasks();
    this.scheduleUpdate();
  },

  scheduleUpdate: function () {
    setInterval(() => {
      this.getTasks();
    }, this.config.refreshInterval * 1000);
  },

  getTasks: function () {
    this.sendSocketNotification("GET_TASKS");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "TASKS_DATA") {
      this.tasks = payload;
      this.updateDom();
    }
  },

  getDom: function () {
    const wrapper = document.createElement("div");

    if (!this.tasks || this.tasks.length === 0) {
      wrapper.innerHTML = "Aucune tâche en cours";
      return wrapper;
    }

    this.tasks.forEach(task => {
      const taskElem = document.createElement("div");
      taskElem.className = this.config.compactMode ? "compact" : "full";
      taskElem.innerHTML = `<strong>${task.title}</strong> - ${task.status} (${task.percent}%)`;
      wrapper.appendChild(taskElem);
    });

    return wrapper;
  }
});
