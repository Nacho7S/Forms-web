const LogsModel = require("../models/logs")
const connectMongoDB = require('../config/mongoDb');


class LogController {
    static async addLog(log) {
        try{
            // console.log(log)
            await connectMongoDB();
            const logStatus = await LogsModel.create(log)
            console.log({log, time: new Date().toISOString()});
            if(logStatus){
                return ("success/log");
            } else{
                return ("error/log");
            }
        }catch (err) {
            console.log(err);
        }
    }
    static async getLogs(req, res, next) {
        try{
            connectMongoDB();
            const dataLogs = await LogsModel.findAll();
            console.log(dataLogs);
            // res.status(200).json({logs: });
        }catch (err){
            next(err);
        }
    }


    static async clearLogs(req, res, next) {

    }
}

module.exports = LogController;