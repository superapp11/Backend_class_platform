const express = require('express');
const cors = require('cors');
const app = express();
const port = 3050;

const userRoutes = require('./src/modules/user/userRoutes');
const studentRoutes = require('./src/modules/student/studentRoutes');
//const adminRoutes = require('./src/modules/admin/adminRoutes');
const teacherRoutes = require('./src/modules/teacher/teacherRoutes');
const courseRoutes = require('./src/modules/courses/courseRoutes');
const unitRoutes = require('./src/modules/unit/unitRoutes');
const examRoutes = require('./src/modules/exam/examRoutes');
const libraryRoutes = require('./src/modules/library/libraryRoutes');
const materialRoutes= require('./src/modules/material/materialRoutes');
const gradeRoutes = require('./src/modules/grade/gradeRoutes');
app.use(express.json());

// Activar CORS
app.use(cors());

// Rutas
app.use('/ilearnify/user', userRoutes);
app.use('/ilearnify/student', studentRoutes);
app.use('/ilearnify/teacher', teacherRoutes);
app.use('/ilearnify/courses', courseRoutes);
app.use('/ilearnify/units', unitRoutes);
app.use('/ilearnify/exams', examRoutes);
app.use('/ilearnify/library', libraryRoutes);
app.use('/ilearnify/material',materialRoutes);
app.use('/ilearnify/grades', gradeRoutes);
// Iniciar el servidor
app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
