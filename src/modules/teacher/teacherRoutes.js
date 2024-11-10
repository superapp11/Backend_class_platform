const express = require('express');
const router = express.Router();
const teacherController = require('./teacherController');

router.post('/register', teacherController.registerTeacher);
router.put('/update/:id', teacherController.updateTeacher);//tiene que ser el id del ususario osea el user_id xd
router.delete('/delete/:id', teacherController.deleteTeacher); //tiene que ser el id del ususario 

module.exports = router;
