const { Schema, default: mongoose } = require("mongoose");

const answersSchema = new Schema({
    formId: { type: Schema.Types.ObjectId, ref: 'Forms', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Questions', required: true },
    // Different answer types stored differently
    textAnswer: String, // For short-answer, paragraph
    selectedOptions: [String], // For checkboxes, multiple-choice
    selectedOption: String, // For dropdown, radio
    fileUrl: String, // For file upload
    numericValue: Number, // For linear scale, rating
    dateValue: Date, // For date
    timeValue: String, // For time
    gridAnswers: [{
        rowId: String,
        columnId: String
    }], // For grid questions
    submittedBy: { type: Schema.Types.ObjectId, ref: 'AnonymUsers', required: true },
    submittedAt: { type: Date, default: Date.now },

});

const AnswersModel = mongoose.model.Answers || mongoose.model("Answers", answersSchema)

module.exports = AnswersModel