const express = require('express');
const router = express.Router();
const studentController = require('./studentController');

router.post('/register', studentController.registerStudent);
router.post('/uploadPredictive', studentController.updloadPredictiveStudent);
router.get('/predictive/:student_id', studentController.getPredictiveStudent);
router.put('/update/:student_id', studentController.updateStudent);
router.delete('/delete/:student_id', studentController.deleteStudent);
router.get('/:student_id', studentController.getStudentById);
router.get('/list/all', studentController.listAllStudents);

module.exports = router;
