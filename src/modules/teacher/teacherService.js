const db = require('../../config/db');

const registerTeacher = async (teacherData) => {
  const { username, password, email, firstName, lastName, birthdate, phone, district } = teacherData;
  
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [userResult] = await connection.execute(
      'INSERT INTO Users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, password, email, 'admin']
    );

    const userId = userResult.insertId;

    await connection.execute(
      'INSERT INTO Teachers (user_id, first_name, last_name, birthdate, phone, district) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, firstName, lastName, birthdate, phone, district]
    );

    await connection.commit();
    connection.release();
    
    return { userId };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw new Error('Error al registrar el profesor');
  }
};

const updateTeacher = async (id, teacherData) => {
  const { username, email, firstName, lastName, birthdate, phone, district } = teacherData;
  
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [userUpdateResult] = await connection.execute(
      'UPDATE Users SET username = ?, email = ? WHERE user_id = ?',
      [username, email, id]
    );

    if (userUpdateResult.affectedRows === 0) {
      throw new Error('Usuario no encontrado');
    }

    const [teacherUpdateResult] = await connection.execute(
      'UPDATE Teachers SET first_name = ?, last_name = ?, birthdate = ?, phone = ?, district = ? WHERE user_id = ?',
      [firstName, lastName, birthdate, phone, district, id]
    );

    if (teacherUpdateResult.affectedRows === 0) {
      throw new Error('Profesor no encontrado');
    }

    await connection.commit();
    connection.release();
    
    return { id };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw new Error(`Error al actualizar el profesor: ${error.message}`);
  }
};


const deleteTeacher = async (userId) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    await connection.execute(
      'DELETE FROM Teachers WHERE user_id = ?',
      [userId]
    );

    await connection.execute(
      'DELETE FROM Users WHERE user_id = ?',
      [userId]
    );

    await connection.commit();
    connection.release();
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw new Error(`Error al eliminar el profesor: ${error.message}`);
  }
};


module.exports = {
  registerTeacher,
  deleteTeacher,
  updateTeacher,
};
