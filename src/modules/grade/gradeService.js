const db = require('../../config/db');

const createGrade = async (grade_name) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    await connection.execute(
      'INSERT INTO Grades (grade_name) VALUES (?)',
      [grade_name]
    );

    await connection.commit();
    connection.release();

    return { grade_name };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error al crear el grado:', error);
    throw new Error('Error al crear el grado');
  }
};

const listGrades = async () => {
  try {
    const [grades] = await db.execute('SELECT * FROM Grades');
    return grades;
  } catch (error) {
    console.error('Error al listar los grados:', error);
    throw new Error('Error al listar los grados');
  }
};

const deleteGrade = async (grade_id) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    await connection.execute('DELETE FROM Grades WHERE grade_id = ?', [grade_id]);

    await connection.commit();
    connection.release();

    return { grade_id };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error al eliminar el grado:', error);
    throw new Error('Error al eliminar el grado');
  }
};

module.exports = {
  createGrade,
  listGrades,
  deleteGrade,
};
