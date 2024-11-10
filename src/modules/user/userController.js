const userService = require('./userService');

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const { user, token } = await userService.authenticateUser(username, password);

    res.status(200).json({
      message: 'Ingreso exitoso',
      status: true,
      data: { user, token },
    });
  } catch (error) {
    res.status(401).json({
      message: 'Credenciales inválidas',
      status: false,
      error: error.message,
    });
  }
};

const recoverPassword = async (req, res) => {
  const { username } = req.body;

  try {
    const result = await userService.sendPasswordResetEmail(username);
    res.status(200).json({
      message: 'Correo de recuperación de contraseña enviado',
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

const listUser = async (req, res) => {
  const { username } = req.body;

  try {
    const result = await userService.listUser();
    res.status(200).json({
      message: 'Lista de usuarios',
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
  loginUser,
  recoverPassword,
  listUser
};
