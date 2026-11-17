/* MMM-Synology-Download_Station : affiche les tâches Download Station d'un NAS Synology. */
Module.register("MMM-Synology-Download_Station", {
  defaults: {
    host: null,             // IP ou nom du NAS (obligatoire)
    port: null,             // null = 5001 en HTTPS, 5000 en HTTP (ports DSM par défaut)
    useHttps: false,
    user: null,             // compte DSM (obligatoire)
    passwd: null,           // mot de passe DSM (obligatoire)
    refreshInterval: 10,    // secondes, minimum 5
    maxItems: 5,
    compactMode: true,      // true = titre tronqué à compactMaxLen caractères
    compactMaxLen: 30,
    textSize: "xsmall",     // classes de taille du cœur : xsmall, small, medium, large, xlarge
    iconSize: "small",
    hideWhenEmpty: true,    // true = module masqué quand aucune tâche ; false = affiche msgEmptyList
    msgEmptyList: "No Download Tasks",
    displayColumns: {
      status_icon: true,
      title: true,
      size: true,
      percent_completed: true,
      speed_download: true,
      speed_upload: true
    },
    displayTasks: {
      waiting: true,
      downloading: true,
      paused: true,
      finishing: true,
      finished: true,
      hash_checking: true,
      seeding: true,
      filehosting_waiting: true,
      extracting: true,
      error: true
    }
  },

  // Icône Font Awesome et classe de couleur par statut de tâche (statuts de l'API Download Station).
  statusIcons: {
    waiting: ["fa-hourglass-half", "ds-gray"],
    filehosting_waiting: ["fa-hourglass-half", "ds-gray"],
    downloading: ["fa-arrow-down", "ds-cyan"],
    paused: ["fa-pause", "ds-gray"],
    finishing: ["fa-spinner", "ds-cyan"],
    finished: ["fa-check", "ds-green"],
    hash_checking: ["fa-rotate", "ds-gray"],
    seeding: ["fa-arrow-up", "ds-green"],
    extracting: ["fa-box-open", "ds-cyan"],
    error: ["fa-triangle-exclamation", "ds-red"]
  },

  start: function () {
    // MagicMirror ne fusionne que le premier niveau de config : on complète les sous-objets
    // avec les défauts pour qu'une config partielle ne masque pas les autres colonnes / statuts.
    this.config.displayColumns = Object.assign({}, this.defaults.displayColumns, this.config.displayColumns);
    this.config.displayTasks = Object.assign({}, this.defaults.displayTasks, this.config.displayTasks);

    this.tasks = null;   // null = pas encore de réponse du NAS
    this.error = null;
    this.timer = null;
    this.hiddenWhenEmpty = false;

    this.fetchTasks();
    this.scheduleUpdate();
  },

  getStyles: function () {
    // Font Awesome n'est pas chargé par le cœur : chaque module qui l'utilise doit le demander.
    // this.file() obligatoire : un chemin avec « / » serait cherché à la racine de MagicMirror.
    return ["font-awesome.css", this.file("css/MMM-Synology-Download_Station.css")];
  },

  // Un seul node_helper pour toutes les instances : on envoie identifier + config.
  fetchTasks: function () {
    this.sendSocketNotification("DS_FETCH", { identifier: this.identifier, config: this.config });
  },

  scheduleUpdate: function () {
    clearInterval(this.timer);
    const seconds = Math.max(5, Number(this.config.refreshInterval) || 10);
    this.timer = setInterval(() => this.fetchTasks(), seconds * 1000);
  },

  // Module masqué (par nous ou par un autre module) : plus d'appel au NAS.
  suspend: function () {
    clearInterval(this.timer);
    this.timer = null;
  },

  resume: function () {
    // Réaffiché par notre show() : le timer tourne déjà (voir updateVisibility).
    if (this.timer) return;
    this.fetchTasks();
    this.scheduleUpdate();
  },

  socketNotificationReceived: function (notification, payload) {
    if (!payload || payload.identifier !== this.identifier) return; // réponse d'une autre instance

    if (notification === "DS_RESULT") {
      this.tasks = payload.tasks;
      this.error = null;
    } else if (notification === "DS_ERROR") {
      // La console du navigateur finit dans les logs pm2 : une ligne par erreur différente seulement.
      if (payload.message !== this.error) Log.error(`[${this.name}] ${payload.message}`);
      this.tasks = [];
      this.error = payload.message;
    } else {
      return;
    }
    this.updateDom(1000);
    this.updateVisibility();
  },

  // Masque le module quand il n'y a rien à montrer (liste vide ou erreur), si hideWhenEmpty.
  updateVisibility: function () {
    if (!this.config.hideWhenEmpty) return;
    const empty = this.tasks.length === 0;
    // hide() appelle suspend() : on relance le timer dans le callback pour détecter
    // l'arrivée d'une nouvelle tâche. Le lockString n'est retiré que par notre show().
    if (empty && !this.hiddenWhenEmpty) {
      this.hiddenWhenEmpty = true;
      this.hide(1000, () => {
        if (!this.timer) this.scheduleUpdate();
      }, { lockString: this.identifier });
    } else if (!empty && this.hiddenWhenEmpty) {
      this.hiddenWhenEmpty = false;
      this.show(1000, () => {}, { lockString: this.identifier });
    }
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = this.config.textSize;

    if (this.tasks === null) {
      wrapper.classList.add("dimmed");
      wrapper.textContent = "Searching for tasks...";
      return wrapper;
    }

    if (this.error) {
      wrapper.classList.add("dimmed");
      wrapper.textContent = `Synology error: ${this.error}`;
      return wrapper;
    }

    if (this.tasks.length === 0) {
      wrapper.classList.add("dimmed");
      wrapper.textContent = this.config.msgEmptyList;
      return wrapper;
    }

    const cols = this.config.displayColumns;
    const table = document.createElement("table");

    this.tasks.forEach((task) => {
      const row = document.createElement("tr");
      if (cols.status_icon) row.appendChild(this.iconCell(task.status));
      if (cols.title) row.appendChild(this.textCell(this.shortTitle(task.title), "ds-title"));
      if (cols.size) row.appendChild(this.textCell(this.formatBytes(task.size)));
      if (cols.percent_completed) row.appendChild(this.textCell(`${task.percent_completed} %`));
      if (cols.speed_download) row.appendChild(this.textCell(`${this.formatBytes(task.speed_download)}/s`));
      if (cols.speed_upload) row.appendChild(this.textCell(`${this.formatBytes(task.speed_upload)}/s`));
      table.appendChild(row);
    });

    wrapper.appendChild(table);
    return wrapper;
  },

  iconCell: function (status) {
    const [icon, color] = this.statusIcons[status] || ["fa-circle-question", "ds-gray"];
    const cell = document.createElement("td");
    const i = document.createElement("i");
    i.className = `fa-solid ${icon} ${color} ${this.config.iconSize}`;
    i.title = status;
    cell.appendChild(i);
    return cell;
  },

  // textContent et non innerHTML : le titre vient du NAS et ne doit pas être interprété comme du HTML.
  textCell: function (text, className) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = text;
    return cell;
  },

  shortTitle: function (title) {
    const text = String(title ?? "");
    const max = this.config.compactMaxLen;
    return this.config.compactMode && text.length > max ? `${text.substring(0, max)}...` : text;
  },

  formatBytes: function (bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
    if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
    return `${(value / 1024 ** 3).toFixed(1)} GB`;
  }
});
