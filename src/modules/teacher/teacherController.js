const teacherService = require('./teacherService');

const registerTeacher = async (req, res) => {
  const { username, password, email, firstName, lastName, birthdate, phone, district } = req.body;

  try {
    const result = await teacherService.registerTeacher({ username, password, email, firstName, lastName, birthdate, phone, district });
    res.status(201).json({
      message: 'Profesor registrado exitosamente',
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

const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { username, email, firstName, lastName, birthdate, phone, district } = req.body;

  try {
    const result = await teacherService.updateTeacher(id, { username, email, firstName, lastName, birthdate, phone, district });
    res.status(200).json({
      message: 'Profesor actualizado exitosamente',
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


const deleteTeacher = async (req, res) => {
  const { id } = req.params;

  try {
    await teacherService.deleteTeacher(id);
    res.status(200).json({
      message: 'Profesor eliminado exitosamente',
      status: true,
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
  registerTeacher,
  updateTeacher,
  deleteTeacher
};
