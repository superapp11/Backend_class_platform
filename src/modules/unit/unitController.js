const unitService = require('./unitService');

const createUnit = async (req, res) => {
  const { course_id, unit_name } = req.body;

  try {
    const result = await unitService.createUnit({ course_id, unit_name });
    res.status(201).json({
      message: 'Unidad creada exitosamente',
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

const listUnitsByCourse = async (req, res) => {
  const { course_id } = req.params;

  try {
    const units = await unitService.listUnitsByCourse(course_id);
    res.status(200).json({
      message: 'Unidades obtenidas exitosamente',
      status: true,
      data: units,
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
  createUnit,
  listUnitsByCourse,
};
