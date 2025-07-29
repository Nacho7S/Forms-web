const { Schema, default: mongoose } = require("mongoose");

const formSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    isActive: { type: Boolean, default: true },
    // materialId: { type: Schema.Types.ObjectId, ref: 'Materials'},
    materialId: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const FormsModel = mongoose.model.Forms || mongoose.model("Forms", formSchema);

module.exports = FormsModel