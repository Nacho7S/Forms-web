const adminController = require("../controllers/adminController");
const adminRoutes = require("express").Router();
const adminAuthotization = require("../middleware/adminAuthorization");
const deleteAuthotization = require("../middleware/deleteAuthorization");

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

adminRoutes.post("/material/:id", adminController.addSubMaterial);

adminRoutes.post("/form/:id", adminController.addQuestion);

adminRoutes.put("/form/:id", deleteAuthotization(),adminController.editForm); // edit form

adminRoutes.put("/form/:formId/:questionId", adminController); //edit question

//if no admin or itself didn't delete
adminRoutes.delete("/form/:id", deleteAuthotization(), adminController.deleteForm);

adminRoutes.use(adminAuthotization);
adminRoutes.post("/create-user", adminController.createUser);
//Delete Users
adminRoutes.delete("/user/:id", adminController.deleteUser);

module.exports = adminRoutes;