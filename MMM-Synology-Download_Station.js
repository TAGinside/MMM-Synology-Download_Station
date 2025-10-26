Module.register("MMM-Synology-Download_Station", {
  defaults: {
    updateInterval: 10 * 1000,
    maxItems: 10,
    compactMode: false,
    textSize: "medium",
    displayColumns: {
      status_icon: true,
      title: true,
      percent_completed: true,
      size: true,
      speed_download: true,
      speed_upload: true
    },
    displayTasks: {
      seeding: true,
      downloading: true,
      finished: true,
      error: true,
      paused: true
    }
  },

  start() {
    this.tasks = [];
    this.sendSocketNotification("CONFIG", this.config);
    this.updateTasks();
    this.scheduleUpdate();
  },

  scheduleUpdate() {
    setInterval(() => {
      this.updateTasks();
    }, this.config.updateInterval);
  },

  updateTasks() {
    this.sendSocketNotification("GET_TASKS");
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "TASKS_DATA") {
      if (payload && Array.isArray(payload)) {
        this.tasks = payload.filter(task =>
          this.config.displayTasks[task.status] !== false
        ).slice(0, this.config.maxItems);
      } else {
        this.tasks = [];
      }
      this.updateDom(1000);
    }
  },

  getStatusIcon(status) {
    const iconMap = {
      downloading: "download",
      finished: "check-circle",
      waiting: "clock-o",
      paused: "pause-circle",
      error: "exclamation-triangle",
      seeding: "share-alt",
      hash_checking: "refresh"
    };
    return iconMap[status] || "question-circle";
  },

  getStatusClass(status) {
    const classMap = {
      downloading: "downloading",
      finished: "finished",
      waiting: "waiting",
      paused: "paused",
      error: "error",
      seeding: "seeding",
      hash_checking: "checking"
    };
    return classMap[status] || "";
  },

  formatSpeed(bytesPerSec) {
    if (!bytesPerSec) return "-";
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    let i = 0;
    let speed = bytesPerSec;
    while (speed >= 1024 && i < sizes.length - 1) {
      speed /= 1024;
      i++;
    }
    return speed.toFixed(1) + " " + sizes[i];
  },

  formatSize(bytes) {
    if (!bytes) return "-";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < sizes.length - 1) {
      size /= 1024;
      i++;
    }
    return size.toFixed(1) + " " + sizes[i];
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "MMM-Synology-Download_Station";
    if (this.config.textSize) {
      wrapper.classList.add(this.config.textSize);
    }
    if (this.config.compactMode) {
      wrapper.classList.add("compact");
    }

    if (!this.tasks.length) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = "Aucune tâche en cours";
      wrapper.appendChild(empty);
      return wrapper;
    }

    const table = document.createElement("table");
    table.className = "ds-table";

    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");

    if (this.config.displayColumns.status_icon) {
      let th = document.createElement("th");
      th.style.width = "40px";
      trHead.appendChild(th);
    }
    if (this.config.displayColumns.title) {
      let th = document.createElement("th");
      th.textContent = "Titre";
      trHead.appendChild(th);
    }
    if (this.config.displayColumns.percent_completed) {
      let th = document.createElement("th");
      th.textContent = "%";
      trHead.appendChild(th);
    }
    if (this.config.displayColumns.speed_download) {
      let th = document.createElement("th");
      th.textContent = "↓ Débit";
      trHead.appendChild(th);
    }
    if (this.config.displayColumns.speed_upload) {
      let th = document.createElement("th");
      th.textContent = "↑ Débit";
      trHead.appendChild(th);
    }
    if (this.config.displayColumns.size) {
      let th = document.createElement("th");
      th.textContent = "Taille";
      trHead.appendChild(th);
    }
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    this.tasks.forEach(task => {
      const tr = document.createElement("tr");

      if (this.config.displayColumns.status_icon) {
        const tdIcon = document.createElement("td");
        tdIcon.style.textAlign = "center";
        const icon = document.createElement("i");
        icon.className = `status-icon status-${this.getStatusClass(task.status)} fa fa-${this.getStatusIcon(task.status)}`;
        tdIcon.appendChild(icon);
        tr.appendChild(tdIcon);
      }

      if (this.config.displayColumns.title) {
        const tdTitle = document.createElement("td");
        tdTitle.className = "task-title";
        tdTitle.textContent = task.title || "Inconnu";
        tr.appendChild(tdTitle);
      }

      if (this.config.displayColumns.percent_completed) {
        const tdPercent = document.createElement("td");
        tdPercent.style.textAlign = "center";
        tdPercent.textContent = task.additional && task.additional.percent ? `${task.additional.percent}%` : "N/A";
        tr.appendChild(tdPercent);
      }

      if (this.config.displayColumns.speed_download) {
        const tdSpeedD = document.createElement("td");
        tdSpeedD.style.textAlign = "right";
        tdSpeedD.textContent = task.additional && task.additional.speed_download ? this.formatSpeed(task.additional.speed_download) : "-";
        tr.appendChild(tdSpeedD);
      }

      if (this.config.displayColumns.speed_upload) {
        const tdSpeedU = document.createElement("td");
        tdSpeedU.style.textAlign = "right";
        tdSpeedU.textContent = task.additional && task.additional.speed_upload ? this.formatSpeed(task.additional.speed_upload) : "-";
        tr.appendChild(tdSpeedU);
      }

      if (this.config.displayColumns.size) {
        const tdSize = document.createElement("td");
        tdSize.style.textAlign = "right";
        tdSize.textContent = this.formatSize(task.size);
        tr.appendChild(tdSize);
      }

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);

    return wrapper;
  }
});
