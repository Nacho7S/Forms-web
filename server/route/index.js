const adminRoutes = require("./admins");
const errorHandler = require("../middleware/errorHandler");
const adminController = require("../controllers/adminController");
const rateLimiterMiddleware = require("../middleware/rateLimiter");
const router = require("express").Router();
const authentication = require("../middleware/authentication");
const ver1 = '/api/v1';
const guestAuthorization = require("../middleware/guestAuthorization");

router.get(ver1, (req, res) => {
    res.json({
        message: "Hello World! use this link to use the api",
        links: "https://something.com"
    }).status(200)
})


router.use(rateLimiterMiddleware);
// form past authentication

// login admin
router.use(ver1 + "/login-admin", adminController.loginAdmin);
// authentication
router.use(authentication)
router.use(guestAuthorization)
router.use(ver1 + "/admin", adminRoutes);

router.use(errorHandler);

module.exports = router;