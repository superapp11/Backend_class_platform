const express = require('express');
const router = express.Router();
const gradeController = require('./gradeController');
const { isAuthenticated, isAdmin } = require('../../middlewares/auth');

router.post('/create', isAuthenticated, isAdmin, gradeController.createGrade);
router.get('/list', gradeController.listGrades);
router.delete('/delete/:grade_id', isAuthenticated, isAdmin, gradeController.deleteGrade);

module.exports = router;
