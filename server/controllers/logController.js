const LogsModel = require("../models/logs");
const connectMongoDB = require('../config/mongoDb');
const mongoose = require('mongoose');

class LogController {
    static async addLog(log) {
        try {
            await connectMongoDB();
            const logStatus = await LogsModel.create(log);
            console.log({log, time: new Date().toISOString()});
            return logStatus ? "success/log" : "error/log";
        } catch (err) {
            console.log(err);
            return "error/log";
        }
    }

    static async getLogs(req, res, next) {
        try {
            await connectMongoDB();


            const { search, action, user, code, startDate, endDate } = req.query;


            const filter = {};


            if (search) {
                filter.log = { $regex: search, $options: 'i' };
            }


            if (action) {
                const actionMap = {
                    'created': /created|has create|create/i,
                    'edited': /edited|has edit|edit/i,
                    'deleted': /deleted|has delete|delete/i,
                    'login': /login|logged in/i,
                    'user': /user/i
                };

                if (actionMap[action.toLowerCase()]) {
                    filter.log = { $regex: actionMap[action.toLowerCase()] };
                }
            }


            if (user) {
                if (mongoose.Types.ObjectId.isValid(user)) {
                    filter.by = user;
                } else {
                    filter.log = { $regex: user, $options: 'i' };
                }
            }


            if (code) {
                filter.code = parseInt(code);
            }


            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate);
                if (endDate) filter.createdAt.$lte = new Date(endDate);
            }

            const dataLogs = await LogsModel.find(filter)
                .sort({ createdAt: -1 })
                .populate('by', 'username');

            res.status(200).json({ dataLogs });

        } catch (err) {
            next(err);
        }
    }

    static async clearLogs(req, res, next) {
        try {
            await connectMongoDB();
            await LogsModel.deleteMany({});
            res.status(200).json({ message: "All logs cleared successfully" });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = LogController;