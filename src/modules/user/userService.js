const db = require('../../config/db');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const authenticateUser = async (username, password) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length === 0) {
      throw new Error('Credenciales inválidas');
    }

    const user = rows[0];
    if (user.role === 'admin') {
      const [teacherRows] = await db.execute('SELECT teacher_id FROM Teachers WHERE user_id = ?', [user.user_id]);
      if (teacherRows.length === 0) {
        throw new Error('No se encontró el ID del profesor');
      }
      user.teacher_id = teacherRows[0].teacher_id;
    }

    if (user.role === 'student') {
      const [teacherRows] = await db.execute('SELECT student_id FROM Students WHERE user_id = ?', [user.user_id]);
      if (teacherRows.length === 0) {
        throw new Error('No se encontró el ID del profesor');
      }
      user.student_id = teacherRows[0].student_id;
    }

    const token = jwt.sign({ id: user.user_id, role: user.role, teacher_id: user.teacher_id , student_id : user.student_id }, 'rafita', { expiresIn: '24h' });

    return { user, token };
  } catch (error) {
    throw new Error('Error en la autenticación del usuario');
  }
};

const sendPasswordResetEmail = async (username) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Users WHERE username = ?', [username]);

    if (rows.length === 0) {
      throw new Error('No se encontró un usuario con el correo y nombre de usuario proporcionados');
    }

    const user = rows[0];

    // Configura el transporte de nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Configura el correo electrónico
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Recuperación de contraseña',
      text: `Hola ${user.username}, tu contraseña es: ${user.password}`,
    };

    // Envía el correo electrónico
    await transporter.sendMail(mailOptions);

    return { message: 'Correo de recuperación de contraseña enviado' };
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw new Error('Error al enviar el correo de recuperación de contraseña');
  }
};

const listUser = async () => {
  const connection = await db.getConnection();

  try {
    const [rows] = await connection.execute(
      `SELECT 
        Users.user_id AS userId, 
        Users.username AS userName, 
        Users.email AS userEmail, 
        Users.role AS userRole,
        Students.student_id AS studentId,
        Students.first_name AS studentFirstName,
        Students.last_name AS studentLastName,
        Students.birthdate AS studentBirthdate,
        Students.phone AS studentPhone,
        Students.district AS studentDistrict,
        Students.gender AS studentGender,
        Students.economic_level AS studentEconomicLevel,
        Students.access_platform AS studentAccessPlatform,
        Students.grade_id AS studentGradeId
      FROM Users
      INNER JOIN Students ON Users.user_id = Students.user_id
      WHERE Users.role = ?`,
      ['student']
    );
    connection.release();
    return rows;
  } catch (error) {
    console.log('Error fetching user list:', error);
    throw error;
  }
};

module.exports = {
  authenticateUser,
  sendPasswordResetEmail,
  listUser
};

