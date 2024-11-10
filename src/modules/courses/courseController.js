const courseService = require('./courseService');

const createCourse = async (req, res) => {
  const { title, description, grade_id } = req.body;
  const teacher_id = req.user.teacher_id; // Obtener el teacher_id del token JWT

  try {
    const result = await courseService.createCourse({ title, description, grade_id, teacher_id });
    res.status(201).json({
      message: 'Curso creado exitosamente',
      status: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};

const listCourses = async (req, res) => {
  const teacher_id = req.user.teacher_id; // Obtener el teacher_id del token JWT

  try {
    const courses = await courseService.listCoursesByTeacher(teacher_id);
    res.status(200).json({
      message: 'Cursos listados exitosamente',
      status: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};

const listAllCourses = async (req, res) => {
  const userId = req.user.id; // Obtener el user_id del token JWT
  const role = req.user.role; // Obtener el rol del usuario del token JWT

  try {
    const courses = await courseService.listAllCourses(userId, role);
    res.status(200).json({
      message: 'Todos los cursos listados exitosamente',
      status: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};


const enrollInCourse = async (req, res) => {
  const user_id = req.user.id; // Obtener el user_id del token JWT
  const { course_id } = req.body;

  try {
    const result = await courseService.enrollInCourse(user_id, course_id);
    res.status(200).json({
      message: 'Matrícula exitosa',
      status: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};

const listEnrolledCoursesWithUnits = async (req, res) => {
  const user_id = req.user.id; // Obtener el user_id del token JWT

  try {
    const courses = await courseService.listEnrolledCoursesWithUnits(user_id);
    res.status(200).json({
      message: 'Cursos matriculados listados exitosamente',
      status: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};

const updateCourse = async (req, res) => {
  const { course_id } = req.params;
  const { title, description } = req.body;

  try {
    const result = await courseService.updateCourse(course_id, { title, description });
    res.status(200).json({
      message: 'Curso actualizado exitosamente',
      status: true,
      data: result,
    });
  } catch (error) {
    if (error.message === 'El curso no existe') {
      res.status(404).json({
        message: 'El curso no existe',
        status: false,
      });
    } else {
      res.status(500).json({
        message: 'Error en el servidor',
        status: false,
        error: error.message,
      });
    }
  }
};
module.exports = {
  createCourse,
  listCourses,
  listAllCourses,
  enrollInCourse,
  listEnrolledCoursesWithUnits,
  updateCourse
};
