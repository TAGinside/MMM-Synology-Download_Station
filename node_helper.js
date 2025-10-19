const NodeHelper = require("node_helper");
const Synology = require("synology-api");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-Synology-Download_Station helper started...");
    this.config = null;
    this.syno = null;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload;
      this.syno = new Synology(
        this.config.host,
        this.config.port,
        this.config.user,
        this.config.passwd,
        false, // https false si pas activé
        false, // cert_verify false pour éviter problème certificat auto-signé
        7,     // version DSM 7
        false  // debug false, mettez true pour journaliser les appels API
      );
    } else if (notification === "GET_TASKS") {
      this.getDownloadStationTasks();
    }
  },

  getDownloadStationTasks: function () {
    if (!this.syno) {
      console.error("Synology API non initialisée");
      return;
    }

    this.syno.Auth.Connect().then(() => {
      return this.syno.DS.getTasks();
    }).then((response) => {
      if (response && response.success) {
        let tasks = [];
        const allTasks = response.data.tasks || [];
        allTasks.forEach(task => {
          tasks.push({
            title: task.title,
            status: task.status,
            percent: task.additional && task.additional.percent ? task.additional.percent : 0
          });
        });
        this.sendSocketNotification("TASKS_DATA", tasks);
      } else {
        this.sendSocketNotification("TASKS_DATA", []);
      }
      return this.syno.Auth.Logout();
    }).catch((error) => {
      console.error("Erreur Synology API :", error);
      this.sendSocketNotification("TASKS_DATA", []);
    });
  }
});
