const { Schema, default: mongoose } = require("mongoose");

const logsSchema = new Schema({
    code: {type: Number, required: true},
    log: {type: String, required: true},
    by: {type: mongoose.Schema.Types.ObjectId, ref: "Users"},
}, {
    timestamps: true,
})

const LogsModel = mongoose.model.Logs || mongoose.model("Logs", logsSchema)

module.exports = LogsModel