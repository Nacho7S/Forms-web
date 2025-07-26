const { Schema, default: mongoose } = require("mongoose");

const usersSchema = new Schema({
    username: { type: String , required: true },
    password: { type: String, required: true },
    roles: {type: String, required: true}
}, {
    timestamps: true,
})

const UsersModel = mongoose.model.Users || mongoose.model("Users", usersSchema)

module.exports = UsersModel