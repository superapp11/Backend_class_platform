const db = require('../../config/db');

const registerStudent = async (studentData) => {
  const { username, password, email, firstName, lastName, birthdate, phone, district, gender, socioeconomicLevel, AccessPlatform, grade_id } = studentData;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [userResult] = await connection.execute(
      'INSERT INTO Users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, password, email, 'student']
    );

    const userId = userResult.insertId;

    await connection.execute(
      'INSERT INTO Students (user_id, first_name, last_name, birthdate, phone, district, gender, economic_level, access_platform, grade_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, firstName, lastName, birthdate, phone, district, gender, socioeconomicLevel, AccessPlatform, grade_id]
    );

    await connection.commit();
    connection.release();

    return { userId };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw new Error('Error al registrar el estudiante');
  }
};

const updloadPredictiveStudent = async (predictiveData) => {
  const { studentId, predictive } = predictiveData;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    await connection.query(
      'DELETE FROM Prediction WHERE studentId = ?',
      [studentId]
    );

    for (const item of predictive) {
      const curso = item.curso;

      const [rows] = await connection.query(
        'SELECT course_id FROM Courses WHERE title = ? LIMIT 1',
        [curso]
      );

      if (rows.length === 0) {
        throw new Error(`No se encontró el curso con el título: ${curso}`);
      }

      const courseId = rows[0].course_id;

      for (const [descripcion, valor] of Object.entries(item.valores_predichos)) {
        await connection.query(
          'INSERT INTO Prediction (studentId, courseId, value, description) VALUES (?, ?, ?, ?)',
          [studentId, courseId, valor, descripcion]
        );
      }
    }

    await connection.commit();
    connection.release();

    return "True";
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw new Error('Error al registrar las predicciones del estudiante: ' + error.message);
  }
};

const getPredictiveStudent = async (studentId) => {
  const connection = await db.getConnection();

  try {
    const [rows] = await connection.query(`
      SELECT c.title AS curso, p.description, p.value
      FROM Prediction p
      INNER JOIN Courses c ON p.courseId = c.course_id
      WHERE p.studentId = ?
    `, [studentId]);

    const predictiveResults = {};

    rows.forEach((row) => {
      const { curso, description, value } = row;

      if (!predictiveResults[curso]) {
        predictiveResults[curso] = {
          curso,
          valores_predichos: {}
        };
      }

      predictiveResults[curso].valores_predichos[description] = value;
    });

    const result = Object.values(predictiveResults);

    connection.release();

    return result;
  } catch (error) {
    connection.release();
    console.error('Error al obtener el estudiante:', error);
    throw new Error('Error al obtener el estudiante');
  }
};


const updateStudent = async (student_id, studentData) => {
  const {
    firstName,
    lastName,
    birthdate,
    phone,
    district,
    gender,
    socioeconomicLevel,
    AccessPlatform,
    username,
    email,
    password
  } = studentData;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar si el estudiante existe
    const [studentRows] = await connection.execute('SELECT * FROM Students WHERE student_id = ?', [student_id]);
    if (studentRows.length === 0) {
      throw new Error('El estudiante no existe');
    }
    const user_id = studentRows[0].user_id;
    console.log("UserId: " + user_id)
    await connection.execute(
      'UPDATE Students SET first_name = ?, last_name = ?, birthdate = ?, phone = ?, district = ?, gender = ?, economic_level = ?, access_platform = ? WHERE student_id = ?',
      [firstName, lastName, birthdate, phone, district, gender, socioeconomicLevel, AccessPlatform, student_id]
    );
    let userUpdateQuery = 'UPDATE Users SET username = ?, email = ? WHERE user_id = ?';
    let queryParams = [username, email, user_id];

    if (password) {
      userUpdateQuery = 'UPDATE Users SET username = ?, email = ?, password = ? WHERE user_id = ?';
      queryParams = [username, email, password, user_id];
    }
    await connection.execute(userUpdateQuery, queryParams);

    await connection.commit();
    connection.release();
    return { student_id, firstName, lastName, birthdate, phone, district, gender, socioeconomicLevel, AccessPlatform, username, email, password };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw new Error(error.message);
  }
};


const deleteStudent = async (student_id) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [studentRows] = await connection.execute('SELECT * FROM Students WHERE student_id = ?', [student_id]);
    if (studentRows.length === 0) {
      throw new Error('El estudiante no existe');
    }

    await connection.execute('DELETE FROM Students WHERE student_id = ?', [student_id]);
    await connection.execute('DELETE FROM Users WHERE user_id = ?', [studentRows[0].user_id]);

    await connection.commit();
    connection.release();

    return { message: 'Estudiante eliminado exitosamente' };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw new Error(error.message);
  }
};

const getStudentById = async (student_id) => {
  try {
    const query = `
      SELECT 
        s.student_id, s.first_name, s.last_name, s.birthdate, s.phone, s.district, 
        s.gender, s.economic_level, s.access_platform, s.grade_id, 
        u.user_id, u.username, u.email, u.role, u.password
      FROM Students s
      JOIN Users u ON s.user_id = u.user_id
      WHERE s.student_id = ?
    `;

    const [studentRows] = await db.execute(query, [student_id]);

    if (studentRows.length === 0) {
      throw new Error('El estudiante no existe');
    }

    return studentRows[0]; // Retorna el estudiante junto con los datos del usuario.
  } catch (error) {
    console.error('Error al obtener el estudiante:', error);
    throw new Error('Error al obtener el estudiante');
  }
};


const listAllStudents = async () => {
  try {
    const [students] = await db.execute('SELECT * FROM Students');
    return students;
  } catch (error) {
    console.error('Error al listar los estudiantes:', error);
    throw new Error('Error al listar los estudiantes');
  }
};

module.exports = {
  registerStudent,
  updateStudent,
  deleteStudent,
  getStudentById,
  getPredictiveStudent,
  updloadPredictiveStudent,
  listAllStudents
};
