const { Schema, default: mongoose } = require("mongoose");

const materialsSchema = new Schema({
    name: { type: String , required: true },
    details: { type: String, required: true },
    sourceFrom: {type: String},
    createdBy: { type: Schema.Types.ObjectId, ref: "Users", required: true },
}, {
    timestamps: true,
})

const MaterialsModel = mongoose.model.Materials || mongoose.model("Materials", materialsSchema)

module.exports = MaterialsModel