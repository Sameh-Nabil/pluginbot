let path = require("path");
const PLUGIN_TABLE = "plugins";
const DATABASE_NAME = "mydb";
const DATABASE_PATH = __dirname;
const PLUGIN_DIRECTORY = "./plugins";

const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: DATABASE_PATH + "/" + DATABASE_NAME
    }
});

let corePlugins = [
    {
        path: "./plugins/core-plugins/express-app",
        "port": 3001,
        "apiBaseUrl": "/api",
        "entry": path.resolve(__dirname, "./public/index.html"),
        "staticFiles": path.resolve(__dirname, "./public/")
    },
    {path: "./plugins/animals/cats"},
    {path: "./plugins/animals/dogs"},
    {path: "./plugins/adoption"},

    {
        path: "./plugins/core-plugins/database",
        knex : knex
    },
]
let config = async function(){
    let pluginTableExists = await knex.schema.hasTable(PLUGIN_TABLE);
    let enabledPlugins =  await (pluginTableExists ?  knex(PLUGIN_TABLE).where("enabled", true) : []);
    let pluginConfigs = enabledPlugins.map(plugin => ({path : plugin.path, ...plugin.config}));

    return {
        plugins: [
            ...corePlugins,
            ...pluginConfigs
        ],
        //install function gets called whenever Pluginbot.prototype.install gets called passing available services
        //todo: should install be a saga? - it is a problem that it depends on services that may or may not be started
        install : function(services, pluginToInstall){
            let db = services.database[0];
            if(!db){
                throw "no database has been provided"
            }
        }
    }
};


//todo : find way of defining plugins through plugins so we don't have to stray of plugin-centric logic
module.exports = config();