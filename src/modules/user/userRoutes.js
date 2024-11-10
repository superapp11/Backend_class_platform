const express = require("express");
const router = express.Router();
const userController = require("./userController");
const { isAuthenticated, isAdmin } = require("../../middlewares/auth");

router.post("/login", userController.loginUser);
router.post("/recover-password", userController.recoverPassword);
router.get("/list", isAuthenticated, isAdmin, userController.listUser);

module.exports = router;
