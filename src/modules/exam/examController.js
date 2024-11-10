const examService = require('./examService');
const multer = require('multer');
const path = require('path');

// Configurar multer para almacenamiento temporal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'temp_images');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.params.question_id}.jpg`);
  }
});

const upload = multer({ storage: storage });

const createExam = async (req, res) => {
  const { course_id, unit_id, title, questions } = req.body;
  const teacher_id = req.user.teacher_id;

  try {
    const result = await examService.createExam({ course_id, unit_id, title, questions, teacher_id });
    res.status(201).json({
      message: 'Examen creado exitosamente',
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

const uploadQuestionImage = async (req, res) => {
  const { question_id } = req.params;
  const imagePath = req.file.path;

  try {
    const result = await examService.uploadQuestionImage(question_id, imagePath);
    res.status(200).json({
      message: 'Imagen subida exitosamente',
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
const listExamsWithDetails = async (req, res) => {
  try {
    const student_id = req.user.student_id;
    const exams = await examService.listExamsWithDetails(student_id);
    res.status(200).json({
      message: 'Exámenes listados exitosamente',
      status: true,
      data: exams,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};

const listExamsByCourseId = async (req, res) => {
  const { course_id } = req.params; // Assuming course_id is sent as a route parameter

  try {
    const exams = await examService.listExamsByCourseId(course_id);
    res.status(200).json({
      message: 'Exámenes listados exitosamente por curso',
      status: true,
      data: exams,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al listar los exámenes por curso',
      status: false,
      error: error.message,
    });
  }
};


const deleteExam = async (req, res) => {
  const { exam_id } = req.params;

  try {
    const result = await examService.deleteExam(exam_id);
    res.status(200).json({
      message: 'Examen eliminado exitosamente',
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

const getExamById = async (req, res) => {
  const { exam_id } = req.params;
  const student_id = req.user.student_id;  // Obtener el student_id del token

  try {
    const exam = await examService.getExamById(exam_id, student_id);  // Pasar student_id al servicio

    res.status(200).json({
      message: 'Examen obtenido exitosamente',
      status: true,
      data: exam,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};

const submitExamAnswers = async (req, res) => {
  const { exam_id, student_id, answers } = req.body;

  try {
    const result = await examService.submitExamAnswers(exam_id, student_id, answers);
    res.status(200).json({
      message: 'Respuestas enviadas exitosamente',
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

const listExamResults = async (req, res) => {
  const { exam_id } = req.params;

  try {
    const results = await examService.listExamResults(exam_id);
    res.status(200).json({
      message: 'Resultados del examen listados exitosamente',
      status: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};

const listExamResultsByStudentId = async (req, res) => {
  const { student_id } = req.params;

  try {
    const results = await examService.listExamResultsByStudentId(student_id);
    res.status(200).json({
      message: 'Resultados del examen listados exitosamente',
      status: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};

const listAllExamResultsWithDetails = async (req, res) => {
  try {
    const results = await examService.listAllExamResultsWithDetails();
    res.status(200).json({
      message: 'Todos los resultados de los exámenes listados exitosamente',
      status: true,
      data: results,
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
  createExam,
  uploadQuestionImage,
  listExamsWithDetails,
  upload,
  listExamsByCourseId,
  deleteExam,
  getExamById,
  submitExamAnswers,
  listExamResults,
  listExamResultsByStudentId,
  listAllExamResultsWithDetails
};
