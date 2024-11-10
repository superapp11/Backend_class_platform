const express = require('express');
const router = express.Router();
const examController = require('./examController');
const { isAuthenticated, isAdmin , isall} = require('../../middlewares/auth');

router.post('/create', isAuthenticated, isAdmin,examController.createExam);
router.post('/upload/:question_id', isAuthenticated, isAdmin, examController.upload.single('image'), examController.uploadQuestionImage);
router.get('/list', isAuthenticated, examController.listExamsWithDetails);
router.get('/list/:course_id', isAuthenticated, examController.listExamsByCourseId); 
router.get('/:exam_id', isAuthenticated,isall, examController.getExamById);
router.delete('/delete/:exam_id', isAuthenticated, isAdmin, examController.deleteExam);
router.post('/submit', isAuthenticated, examController.submitExamAnswers);
router.get('/results/:exam_id', isAuthenticated, examController.listExamResults); 
router.get('/results/student/:student_id', isAuthenticated, examController.listExamResultsByStudentId);
router.get('/result/all', isAuthenticated, examController.listAllExamResultsWithDetails);


module.exports = router;
 