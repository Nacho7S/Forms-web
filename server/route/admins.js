const adminController = require("../controllers/adminController");
const adminRoutes = require("express").Router();
const adminAuthotization = require("../middleware/adminAuthorization");
const deleteAuthotization = require("../middleware/deleteAuthorization");
const LogController = require("../controllers/logController");

adminRoutes.get("/", async (req, res) => {
    res.json({
        message: "hello there this is admin",
        links: "https://something.com"
    }).status(200)
})

// adminRoutes.post("/login-admin", adminController.loginAdmin);
// adminRoutes.use(deleteAuthotization);


adminRoutes.post("/create-form", adminController.createForm);

adminRoutes.post("/create-material", adminController.createMaterial);

adminRoutes.delete("/material/:id", deleteAuthotization(), adminController.deleteMaterial);

adminRoutes.put("/material/:id", deleteAuthotization(), adminController.updateMaterial);

adminRoutes.post("/material/:id", deleteAuthotization(), adminController.addSubMaterial);

adminRoutes.put("/sub-material/:id", deleteAuthotization(), adminController.editSubMaterial);

adminRoutes.delete("/sub-material/:id", deleteAuthotization(), adminController.deleteSubMaterial);

adminRoutes.put("/form/:id", deleteAuthotization(),adminController.editForm);

adminRoutes.delete("/form/:id", deleteAuthotization(), adminController.deleteForm);

adminRoutes.post("/form/:id", adminController.addQuestion);

adminRoutes.put("/question/:id", deleteAuthotization(), adminController.editQuestion);

adminRoutes.delete("/question/:id", deleteAuthotization() ,adminController.deleteQuestion);

adminRoutes.get("/form", adminController.getAllForms)

adminRoutes.get("/form/:id", adminController.getForm);

adminRoutes.get("/user/:id", adminController.userDetails);

adminRoutes.get("/material", adminController.getMaterial);

adminRoutes.get("/material/:id", adminController.getMaterialById);


adminRoutes.use(adminAuthotization);

adminRoutes.get("/logs", LogController.getLogs);

adminRoutes.post("/create-user", adminController.createUser);
//Delete Users
adminRoutes.delete("/user/:id", adminController.deleteUser);

adminRoutes.get("/user", adminController.getAllUsers)

module.exports = adminRoutes;