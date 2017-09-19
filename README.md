# Pluginbot 
Lightweight, unopinionated plugin framework - create extremely extensible and scalable apps using a service-based architecture.

<img src="https://img.shields.io/badge/stability-experimental-red.svg">[![Gitter](https://badges.gitter.im/service-bot/pluginbot.svg)](https://gitter.im/service-bot/pluginbot?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

### Overview
At a high level - pluginbot is an app framework that consists of plugins which can provide/consume services. To define a plugin you define a function which provide services and a function that can consume services, consumption happens in the form of a redux-saga so your plugin can wait around for your desired service to be provided which elmiminates complex dependency chains since you just wait around for your desired servies and handle them whenever they come into the pipeline.

This architecture allows for a highly extensible application because a plugin that adds functionality would just provide services other plugins consume (or consume services other plugins provide) - for example a plugin could provide new routes to be consumed by a router plugin (which would be waiting around for new routes to add).

#### Configuration
In order for plugins to run, they have to be declared in a configuration 
which will contain at a minimum the path of the plugin. Here you would define
environment specific data.

Configuration can either be json or a js file that exports an object/Promise that resolves to an object 

The plugins configured here represent the "enabled and installed" plugins - there will be more complex logic regarding
Install/uninstall and enable/disable in later releases. 




```js
//config.js

//path should be relative to the config file location, can refer to NPM modules as well
module.exports = {
        plugins: [
            {"path": "express-router", "baseUrl" : "/api/v1"},
            {"path": "./database", "host": "localhost", "port" : 5432, "username" : "admin", "database" : "my_app_db"},
            {"path": "./server", "port": 3001},
            ],
};
```


#### Plugin Interface  
A plugin consists of a module which can export two functions (neither are required), start which decides what services a plugin should initially provide
and consumer which decides how to consume services that have been provided by other plugins 


```js
//router.js

//take used for consumption
const {take} = require("redux-saga/effects");
module.exports = {
    /**
    * This function defines the initial services which a plugin can provide
    * 
    * @param config {Object.<string, Object.<string, *>>} 
    * - Keys the config option name to the config's value defined in the Pluginbot configuration
    *  
    * @param imports {Object.<string, Plugin>} 
    * Keys the required plugins' names to their respective objects (in an initialized state)
    * 
    * @returns {Object.<string, *|*[]> | Promise} - Returns an object containing provided services keyed by service name
    */
    start : function (config, imports) {
        
        //contrived example - router would not provide its own routes usually...
        let express = require("express");
        let Router = express.Router();
        Router.get("/info", (req, res) => {
            res.json({"info" : "great info"})
        });
        
        Router.get("/something", (req, res) => {
            res.json({"something" : "great something?"});
        });
        
        //return express route to be consumed by consumer function
        return {
            expressRoute: Router
        }
    },
    
    /**
    * consumer functions are generator functions which can wait for specific services to be provided and define how 
    * to consume them as they become available
    * 
    * @param config {Object.<string, Object.<string, *>>} 
    * Keys the config option name to the config's value defined in the Pluginbot configuration
    * 
    * @param imports {Object.<string, Plugin>} 
    * Keys the required plugins' names to their respective objects (in an initialized state)
    * 
    * @param services {Object.<string, actionChannel>} an object containing actionChannels for each of the different
    * services a plugin consumes
    */
    
    consumer : function*(config, imports, services){
        
        //take the first expressApp service provided (more logic needed to handle multiple express apps)
        let action = yield take(services.expressApp);
        let app = action.service;
        while(true){
            //pauses function until new route gets provided
            let newRouteAction = yield take(services.expressRoute);
            let newRoute = newRouteAction.service;
            //apply route to express app
            app.use(config.basePath, newRoute);
            
        }
    }
}
```



 
#### package.json
In order for a pluginbot plugin to be considered valid it requires a pluginbot 
section to be defined in the package.json. For a basic definition you just need 
to define where the entry point to your plugin is and the services the plugin consumes (if any)
```js
//./express-router/package.json
{
    "name": "express-router",
    "version": "0.0.1",
    "private": true,
    "pluginbot": {
        "main" : "router.js", 
        "consumes": ["expressApp", "expressRoute"]
    }
}
```
### Starting Pluginbot
To start pluginbot on the server, just call createPluginbot and initialize it

```javascript
//app.js
const CONFIG_PATH = "./config.js"
let path = require("path");
let Pluginbot = require("pluginbot");
//pass full path to createPluginbot
Pluginbot.createPluginbot(path.resolve(__dirname, CONFIG_PATH))
.then(pluginbot => pluginbot.initialize())
.catch(e => {
    console.error(e);
});

```


### Advanced
##### Requires
##### Arrays of services
##### Clien
see [pluginbot-react](https://github.com/service-bot/pluginbot-react)


###Credit
