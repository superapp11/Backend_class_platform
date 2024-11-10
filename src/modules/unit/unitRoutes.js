const express = require("express");
const router = express.Router();
const unitController = require("./unitController");
const { isAuthenticated, isAdmin } = require("../../middlewares/auth");

router.post("/create", isAuthenticated, isAdmin, unitController.createUnit);
router.get("/:course_id", isAuthenticated, unitController.listUnitsByCourse);
module.exports = router;
