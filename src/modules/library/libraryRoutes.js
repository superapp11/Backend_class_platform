const express = require('express');
const router = express.Router();
const libraryController = require('./libraryController');
const { isAuthenticated, isAdmin, isall } = require('../../middlewares/auth');
const multer = require('multer');
const path = require('path');

// Configurar Multer para mantener la extensión del archivo original
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ storage: storage });

router.post('/create', isAuthenticated, isAdmin, upload.single('document'), libraryController.createLibraryDocument);
router.get('/list/:course_id', isAuthenticated, isAdmin, libraryController.listLibraryDocumentsByCourse);
router.get('/user-documents', isAuthenticated,isall, libraryController.listLibraryDocumentsByUser);
router.put('/update/:id', isAuthenticated, isAdmin, upload.single('document'), libraryController.updateLibraryDocument);
router.delete('/delete/:id', isAuthenticated, isAdmin, libraryController.deleteLibraryDocument);


module.exports = router;
