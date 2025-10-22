const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({
  start() {
    console.log("MMM-Synology-Download_Station helper lancé");
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload;
      console.log("Configuration reçue :", this.config);
    } else if (notification === "GET_TASKS") {
      this.getTasks();
    }
  },

  async getTasks() {
    if (!this.config) {
      console.error("Pas de configuration");
      return;
    }

    const baseUrl = `http://${this.config.host}:${this.config.port}/webapi/entry.cgi`;
    const session = axios.create({
      baseURL: baseUrl,
      params: {
        api: "SYNO.DownloadStation.Task",
        method: "list",
        version: "1",
        _sid: "" // si besoin, gestion de session
      },
    });

    try {
      // Authentification (si nécessaire, selon API DSM)
      // Puis récupération des tâches
      const response = await session.get("", {
        params: {
          api: "SYNO.DownloadStation.Task",
          method: "list",
          version: "1",
        },
      });
      if (response.data && response.data.success) {
        this.sendSocketNotification("TASKS_DATA", response.data.data.tasks);
      } else {
        this.sendSocketNotification("TASKS_DATA", []);
      }
    } catch (error) {
      console.error("Échec API Synology :", error);
      this.sendSocketNotification("TASKS_DATA", []);
    }
  }
});
