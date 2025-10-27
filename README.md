# Synology Download Station
Module: MMM-Synology-Download_Station

This [MagicMirror](https://github.com/MichMich/MagicMirror) module, display Synology Download Station tasks.

compacted mode : <code>bottom_center</code>

![Synology DS visualisation 1](https://github.com/TAGinside/MMM-Synology-Download_Station/blob/master/Screenshot/Screenshot_01.png?raw=true)

## Dependencies 
- An installation of [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror)

## Installation

Navigate into your MagicMirror's `modules` folder:
```
cd ~/MagicMirror/modules
```

Clone this repository:
```
git clone https://github.com/TAGinside/MMM-Synology-Download_Station
```

Navigate to the new `MMM-Synology-Download_Station` with:
```
cd MMM-Synology-Download_Station
```
Install the node dependencies.
```
npm install
```

Configure the module in your `config.js` file.

## Update

```sh
cd ~/MagicMirror/modules/MMM-Synology-Download_Station
git pull
npm ci
```


## Using the module

To use this module, add it to the modules array in the `config/config.js` file. 


```javascript
modules: [
  {
    module: "MMM-SynologyDownload_Station",
    position: "top_center",
    config: {
      host: "x.x.x.x",           // IP/DNS your Synology NAS
      port: 5001,                // Port HTTPS DSM default
      useHttps: true,            // use HTTPS
      user: "username",          // username
      passwd: "password",        // Password
      refreshInterval: 10,       // in seconds
      maxItems: 8,
      compactMode: true,
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
    }
  }
]
```

## Configuration options

The following properties can be configured:

| Option                       | Description
| ---------------------------- | -----------
| `host`                       | Synology Hostname/IP.  <br><br>**Required**<br>**Possible values:** `localhost`, `url` or a IP<br>**Default value:** `null`
| `port`                       | Synology port.  <br><br><br>**Default value:** ` 5001 ` (Default Synology port for HTTPS)
| `user`                       | Synology account.  <br><br>**Required**<br>**Default value:** `null`
| `passwd`                     | Account password.  <br><br>**Required**<br>**Default value:** `null`
| `refreshInterval`            | The refresh interval (in seconds).<br><br>**Default value:** `10`
| `maxItems`                   | Maxium number displayed tasks<br><br>**Possible values:** `numeric`<br>**Default value:** `5`
| `compactMode`                | The size of module is reduced. Number of caracters of the task name is limited by `compactMaxLen`<br>**Recommended for:** `top_left`, `top_right`, ` bottom_left`, ` bottom_right`, ` bottom_center`, `middle_center`<br>**Possible values:** `true` or `false`<br>**Default value:** `true`
| `compactMaxLen`              | Maximum number of caracters of the task name<br><br>**Possible values:** `numeric`<br>**Default value:** `30`
| `textSize`                   | <br><br>**Possible values:** `xsmall`, `small`, `medium`, `large`, `xlarge`<br>**Default value:** `xsmall`
| `iconSize`                   | Size of FontAwesome icons<br><br>**Possible values:** `xsmall`, `small`, `medium`, `large`, `xlarge`<br>**Default value:** `small`
| `msgEmptyList`	           | Display message when no tasks on Download Station<br><br>**Possible values:** Any string you want!<br>**Default value:** `No task`
