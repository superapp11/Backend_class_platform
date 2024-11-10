const studentService = require('./studentService');

const registerStudent = async (req, res) => {
  const { username, password, email, firstName, lastName, birthdate, phone, district, gender, socioeconomicLevel, AccessPlatform, grade_id } = req.body;

  try {
    const result = await studentService.registerStudent({ username, password, email, firstName, lastName, birthdate, phone, district, gender, socioeconomicLevel, AccessPlatform, grade_id });
    res.status(201).json({
      message: 'Estudiante registrado exitosamente',
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

const getPredictiveStudent = async (req, res) => {
  const { student_id } = req.params;

  try {
    const result = await studentService.getPredictiveStudent(student_id);
    res.status(200).json({
      message: 'Informe prediccion de estudiante',
      status: true,
      data: result,
    });
  } catch (error) {
    if (error.message === 'El estudiante no existe') {
      res.status(404).json({
        message: 'El estudiante no existe',
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

const updloadPredictiveStudent = async (req, res) => {

  try {
    const result = await studentService.updloadPredictiveStudent(req.body);
    res.status(201).json({
      message: 'Predicción del estudiante registrado exitosamente',
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

const updateStudent = async (req, res) => {
  const { student_id } = req.params;

  try {
    const result = await studentService.updateStudent(student_id, req.body);
    res.status(200).json({
      message: 'Estudiante actualizado exitosamente',
      status: true,
      data: result,
    });
  } catch (error) {
    if (error.message === 'El estudiante no existe') {
      res.status(404).json({
        message: 'El estudiante no existe',
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

const deleteStudent = async (req, res) => {
  const { student_id } = req.params;

  try {
    const result = await studentService.deleteStudent(student_id);
    res.status(200).json({
      message: 'Estudiante eliminado exitosamente',
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

const getStudentById = async (req, res) => {
  const { student_id } = req.params;

  try {
    const student = await studentService.getStudentById(student_id);
    res.status(200).json({
      message: 'Estudiante obtenido exitosamente',
      status: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};


const listAllStudents = async (req, res) => {
  try {
    const students = await studentService.listAllStudents();
    res.status(200).json({
      message: 'Estudiantes listados exitosamente',
      status: true,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};

module.exports = {
  registerStudent,
  updateStudent,
  deleteStudent,
  getPredictiveStudent,
  updloadPredictiveStudent,
  getStudentById,
  listAllStudents
};
