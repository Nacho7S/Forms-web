const { Schema, default: mongoose } = require("mongoose");

const questionsSchema = new Schema({
    formId: { type: Schema.Types.ObjectId, ref: 'Form', required: true },
    // materialId: { type: Schema.Types.ObjectId, ref: 'Materials'},
    subMaterialId: { type: String},
    questionText: { type: String, required: true },
    questionType: {
        type: String,
        required: true,
        enum: [
            'short-answer',
            'paragraph',
            'multiple-choice',
            'checkboxes',
            'dropdown',
            'file-upload',
            'linear-scale',
            'rating',
            'multiple-choice-grid',
            'checkbox-grid',
            'date',
            'time'
        ]
    },
    // For multiple choice, checkboxes, dropdown
    options: [{
        value: String,
        text: String
    }],
    // For linear scale
    scale: {
        min: { type: Number, default: 1 },
        max: { type: Number, default: 5 },
        minLabel: String,
        maxLabel: String
    },
    isRequired: { type: Boolean, default: false },
    order: { type: Number, required: true, unique: true },
});

const QuestionsModel = mongoose.model.Questions || mongoose.model("Questions", questionsSchema)

module.exports = QuestionsModel