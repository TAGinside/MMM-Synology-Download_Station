/* Back-end : appels à l'API Web du NAS (SYNO.API.Auth, SYNO.DownloadStation.Task). */
const NodeHelper = require("node_helper");
const Log = require("logger");
const http = require("node:http");
const https = require("node:https");

const TIMEOUT = 10000; // ms avant d'abandonner une requête vers le NAS

// Codes DSM « session invalide ou expirée » : on se reconnecte et on réessaie une fois.
const SESSION_ERRORS = [105, 106, 107, 119];

// Codes DSM de SYNO.API.Auth, pour un message lisible dans les logs et sur le miroir.
const LOGIN_ERRORS = {
  400: "wrong account or password",
  401: "account disabled",
  402: "permission denied",
  403: "2-step verification required",
  404: "2-step verification failed",
  407: "IP address blocked by the NAS"
};

module.exports = NodeHelper.create({
  start: function () {
    // Une session DSM par instance du module (clé = identifier du module).
    this.sessions = {};
    Log.log(`node_helper started`);
  },

  stop: function () {
    // Arrêt de MagicMirror : on ferme les sessions DSM ouvertes, sans attendre la réponse.
    for (const session of Object.values(this.sessions)) {
      if (session.sid) this.logout(session).catch(() => {});
    }
  },

  socketNotificationReceived: async function (notification, payload) {
    if (notification !== "DS_FETCH" || !payload) return;
    const { identifier, config } = payload;

    const session = this.sessions[identifier] ??= { sid: null, config: null, busy: false, lastError: null };
    // Requête précédente encore en cours (NAS lent) : on saute ce tour plutôt que d'empiler.
    if (session.busy) return;
    session.busy = true;
    session.config = config;

    // try/catch obligatoire : une exception non attrapée ferait tomber tout MagicMirror.
    try {
      const tasks = await this.getTasks(session, config);
      if (session.lastError) Log.log(`connection to ${config.host} restored`);
      session.lastError = null;
      this.sendSocketNotification("DS_RESULT", { identifier, tasks });
    } catch (error) {
      const message = error.message || String(error);
      // Une seule ligne de log par erreur différente, pas une toutes les 10 secondes.
      if (message !== session.lastError) Log.error(message);
      session.lastError = message;
      this.sendSocketNotification("DS_ERROR", { identifier, message });
    } finally {
      session.busy = false;
    }
  },

  getTasks: async function (session, config) {
    if (!config.host || !config.user || !config.passwd) {
      throw new Error("host, user and passwd are required in config.js");
    }

    let response = await this.listTasks(session, config);
    // Session expirée côté NAS : nouvelle connexion puis un seul nouvel essai.
    if (!response.success && SESSION_ERRORS.includes(response.error?.code)) {
      session.sid = null;
      response = await this.listTasks(session, config);
    }
    if (!response.success) {
      throw new Error(`Download Station error ${response.error?.code ?? "unknown"}`);
    }

    return (response.data?.tasks || [])
      .filter((task) => config.displayTasks?.[task.status])
      .slice(0, config.maxItems)
      .map((task) => {
        const transfer = task.additional?.transfer || {};
        const size = Number(task.size) || 0;
        const downloaded = Number(transfer.size_downloaded) || 0;
        const percent = size > 0 ? Math.min(100, (downloaded / size) * 100) : 0;
        return {
          id: task.id,
          title: task.title,
          size,
          percent_completed: percent.toFixed(1),
          status: task.status,
          speed_download: Number(transfer.speed_download) || 0,
          speed_upload: Number(transfer.speed_upload) || 0
        };
      });
  },

  listTasks: async function (session, config) {
    if (!session.sid) await this.login(session, config);
    return this.request(config, "DownloadStation/task.cgi", {
      api: "SYNO.DownloadStation.Task",
      version: 1,
      method: "list",
      additional: "detail,transfer",
      _sid: session.sid
    });
  },

  login: async function (session, config) {
    // URLSearchParams encode user et passwd : un « & » ou un « # » dans le mot de passe ne casse plus la requête.
    const response = await this.request(config, "auth.cgi", {
      api: "SYNO.API.Auth",
      version: 6,
      method: "login",
      account: config.user,
      passwd: config.passwd,
      session: "DownloadStation",
      format: "sid"
    });
    if (!response.success || !response.data?.sid) {
      const code = response.error?.code;
      throw new Error(`login to ${config.host} failed: ${LOGIN_ERRORS[code] || `error ${code ?? "unknown"}`}`);
    }
    session.sid = response.data.sid;
    Log.log(`connected to ${config.host}`);
  },

  logout: async function (session) {
    const sid = session.sid;
    session.sid = null;
    await this.request(session.config, "auth.cgi", {
      api: "SYNO.API.Auth",
      version: 6,
      method: "logout",
      session: "DownloadStation",
      _sid: sid
    });
  },

  // GET vers /webapi/<cgi> avec les modules natifs de Node (pas de dépendance npm).
  request: function (config, cgi, params) {
    const secure = Boolean(config.useHttps);
    const port = config.port || (secure ? 5001 : 5000);
    const options = {
      host: config.host,
      port,
      path: `/webapi/${cgi}?${new URLSearchParams(params)}`,
      method: "GET",
      timeout: TIMEOUT,
      // Le certificat d'un NAS est souvent auto-signé : on l'accepte (réseau local).
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      const req = (secure ? https : http).request(options, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} from ${config.host}:${port}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error(`invalid answer from ${config.host}:${port}`));
          }
        });
        res.on("error", reject);
      });
      req.on("timeout", () => req.destroy(new Error(`no answer from ${config.host}:${port}`)));
      req.on("error", reject);
      req.end();
    });
  }
});
