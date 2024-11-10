const express = require("express");
const router = express.Router();
const materialController = require("./materialController");
const { isAuthenticated, isAdmin } = require("../../middlewares/auth");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Configurar multer para la subida de archivos

router.post(
  "/create",
  isAuthenticated,
  isAdmin,
  upload.single("file"),
  materialController.createMaterial
);
router.get(
  "/list/:unit_id",
  isAuthenticated,
  materialController.listMaterialsByUnit
);
router.delete(
  "/delete/:material_id",
  isAuthenticated,
  isAdmin,
  materialController.deleteMaterial
);

module.exports = router;
