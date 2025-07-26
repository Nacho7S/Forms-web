const mongoose = require("mongoose")

const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URLS);
        console.log("connected to MongoDB");
    } catch (err) {
        console.log(err);
    }
}

module.exports = connectMongoDB
