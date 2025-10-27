const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({
  start: function() {
    console.log("[MMM-Synology-Download_Station] node_helper démarré.");
  },

  socketNotificationReceived: async function(notification, payload) {
    if (notification === "DS_INIT") {
      console.log("[MMM-Synology-Download_Station] Configuration reçue:", payload);
    }
    if (notification === "DS_GET") {
      try {
        const sessionId = await this._login(payload);
        const tasks = await this._getTasks(sessionId, payload);
        this.sendSocketNotification("DS_RESULT", tasks);
        await this._logout(sessionId, payload);
      } catch (err) {
        this.sendSocketNotification("DS_ERROR", err.message || err);
        console.log("[MMM-Synology-Download_Station] Erreur back:", err.message || err);
      }
    }
  },

  _login: async function(config) {
    const protocol = config.useHttps ? "https" : "http";
    const url = `${protocol}://${config.host}:${config.port}/webapi/auth.cgi?api=SYNO.API.Auth&method=login&version=6&account=${config.user}&passwd=${config.passwd}&session=DownloadStation&format=sid`;
    const response = await axios.get(url, { httpsAgent: config.useHttps ? new (require('https').Agent)({ rejectUnauthorized: false }) : undefined });
    if (!response.data.success) throw new Error("Connexion Synology échouée");
    console.log("[MMM-Synology-Download_Station] Connexion Synology réussie.");
    return response.data.data.sid;
  },

  _getTasks: async function(sessionId, config) {
    const protocol = config.useHttps ? "https" : "http";
    const url = `${protocol}://${config.host}:${config.port}/webapi/DownloadStation/task.cgi?api=SYNO.DownloadStation.Task&version=1&method=list&_sid=${sessionId}`;
    const response = await axios.get(url, { httpsAgent: config.useHttps ? new (require('https').Agent)({ rejectUnauthorized: false }) : undefined });
    if (!response.data.success) throw new Error("Récupération des tâches Synology échouée");
    const taskList = response.data.data.tasks.filter(task =>
      config.displayTasks[task.status]
    );
    console.log(`[MMM-Synology-Download_Station] Tâches récupérées: ${taskList.length}`);
    return taskList.slice(0, config.maxItems).map(task => ({
      id: task.id,
      title: task.title,
      size: task.size,
      percent_completed: task.additional?.transfer?.percent_completed || 0,
      status: task.status,
      speed_download: task.additional?.transfer?.speed_download || 0,
      speed_upload: task.additional?.transfer?.speed_upload || 0
    }));
  },

  _logout: async function(sessionId, config) {
    const protocol = config.useHttps ? "https" : "http";
    const url = `${protocol}://${config.host}:${config.port}/webapi/auth.cgi?api=SYNO.API.Auth&method=logout&version=6&session=DownloadStation&_sid=${sessionId}`;
    await axios.get(url, { httpsAgent: config.useHttps ? new (require('https').Agent)({ rejectUnauthorized: false }) : undefined });
    console.log("[MMM-Synology-Download_Station] Déconnexion Synology.");
  }
});
