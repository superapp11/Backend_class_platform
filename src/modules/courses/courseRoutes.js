const express = require('express');
const router = express.Router();
const courseController = require('./courseController');
const { isAuthenticated, isAdmin, isall } = require('../../middlewares/auth');

router.post('/create', isAuthenticated, isAdmin, courseController.createCourse);
router.get('/list', isAuthenticated, isAdmin, courseController.listCourses);
router.get('/listAll', isAuthenticated, isall, courseController.listAllCourses);
router.post('/enroll', isAuthenticated, courseController.enrollInCourse);
router.get('/listEnrolled', isAuthenticated, courseController.listEnrolledCoursesWithUnits);
router.put('/update/:course_id', isAuthenticated, isAdmin, courseController.updateCourse);
module.exports = router;
