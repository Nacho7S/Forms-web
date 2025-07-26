const app = require("../app");
const connectMongoDB = require("../config/mongoDb");
const port = process.env.SERVER_PORT
// const {LoggerAdaptToConsole} = require("console-log-json");
// LoggerAdaptToConsole();


connectMongoDB().then(() => {
app.listen(port, () => {
    console.log("Server running on port " + port);
})
});
