const { Schema, default: mongoose } = require("mongoose");

const anonymUsersSchema = new Schema({
    level: { type: String , required: true },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Questions",
    }
}, {
    timestamps: true,
})

const AnonymUsersModel = mongoose.model.AnonymUsers || mongoose.model("AnonymUsers", anonymUsersSchema)

module.exports = AnonymUsersModel