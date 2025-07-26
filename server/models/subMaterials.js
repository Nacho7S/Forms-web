const { Schema, mongoose } = require("mongoose");

const subMaterialsSchema = new Schema({
    picture: { type: String }, // URL or base64
    name: { type: String, required: true },
    details: { type: String },
    materialId: {
        type: Schema.Types.ObjectId,
        ref: 'Material',
        required: true
    }
}, { timestamps: true });

const SubMaterialsModel = mongoose.model.SubMaterials ||
    mongoose.model("SubMaterials", subMaterialsSchema);

module.exports = SubMaterialsModel;