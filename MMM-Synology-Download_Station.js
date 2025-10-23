Module.register("MMM-Synology-Download_Station", {
  defaults: {
    updateInterval: 60 * 1000, // 60 secondes
    animationSpeed: 1000,
    maxItems: 5,
  },

  start() {
    Log.info("MMM-Synology-Download_Station démarre...");
    this.tasks = [];
    this.sendSocketNotification("CONFIG", this.config);

    //Envoie la notification CHECK_API pour vérifier la présence de l'API
    this.sendSocketNotification("CHECK_API");

    this.getTasks();
    this.scheduleUpdate();
  },

  getTasks() {
    this.sendSocketNotification("GET_TASKS");
  },

  scheduleUpdate() {
    setInterval(() => {
      this.getTasks();
    }, this.config.updateInterval);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "TASKS_DATA") {
      Log.info("TASKS_DATA reçu :", payload);
      if (payload && Array.isArray(payload)) {
        this.tasks = payload.slice(0, this.config.maxItems);
      } else {
        this.tasks = [];
      }
      this.updateDom(this.config.animationSpeed);
    }
    // Pour afficher les logs ou autres notifications venant du node helper
    else {
      Log.info(`Notification reçue (${notification}):`, payload);
    }
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.style.whiteSpace = "pre-wrap";

    if (!this.tasks || this.tasks.length === 0) {
      wrapper.textContent = "Aucune tâche Download Station reçue.";
    } else {
      wrapper.textContent = JSON.stringify(this.tasks, null, 2);
    }

    return wrapper;
  }
});
