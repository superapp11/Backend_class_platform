const gradeService = require('./gradeService');

const createGrade = async (req, res) => {
  const { grade_name } = req.body;

  try {
    const result = await gradeService.createGrade(grade_name);
    res.status(201).json({
      message: 'Grado creado exitosamente',
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

const listGrades = async (req, res) => {
  try {
    const grades = await gradeService.listGrades();
    res.status(200).json({
      message: 'Grados listados exitosamente',
      status: true,
      data: grades,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};

const deleteGrade = async (req, res) => {
  const { grade_id } = req.params;

  try {
    const result = await gradeService.deleteGrade(grade_id);
    res.status(200).json({
      message: 'Grado eliminado exitosamente',
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

module.exports = {
  createGrade,
  listGrades,
  deleteGrade,
};
