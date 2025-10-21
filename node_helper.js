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
      console.log("Configuration reçue :", this.config);
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
      console.log("Connexion à Synology API initialisée");
    } else if (notification === "GET_TASKS") {
      console.log("Requête pour récupérer les tâches...");
      this.getDownloadStationTasks();
    }
  },

  getDownloadStationTasks: function () {
    if (!this.syno) {
      console.error("Synology API non initialisée");
      return;
    }

    console.log("Connexion à Synology pour récupération des tâches...");
    this.syno.Auth.Connect().then(() => {
      console.log("Connexion réussie, récupération des tâches...");
      return this.syno.DS.getTasks();
    }).then((response) => {
      console.log("Réponse API reçu :", response);
      if (response && response.success) {
        let tasks = [];
        const allTasks = response.data.tasks || [];
        console.log(`Nombre de tâches récupérées : ${allTasks.length}`);
        allTasks.forEach(task => {
          console.log("Tâche :", task);
          tasks.push({
            title: task.title,
            status: task.status,
            percent: task.additional && task.additional.percent ? task.additional.percent : 0
          });
        });
        this.sendSocketNotification("TASKS_DATA", tasks);
      } else {
        console.log("Aucune tâche ou réponse API échouée");
        this.sendSocketNotification("TASKS_DATA", []);
      }
      return this.syno.Auth.Logout();
    }).catch((error) => {
      console.error("Erreur lors de la connexion ou récupération :", error);
      this.sendSocketNotification("TASKS_DATA", []);
    });
  }
});
