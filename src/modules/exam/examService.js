const db = require('../../config/db');
const scpClient = require('scp2');
const fs = require('fs');
const path = require('path');

const remoteHost = '143.244.144.235';
const remoteUser = 'root';
const remotePassword = 'Sys4Log$$sa';
const remotePath = '/var/www/images';

const createExam = async (examData) => {
  const { course_id, unit_id, title, questions, teacher_id } = examData;
  
  try {
    // Validar la existencia del curso y la unidad
    const [courseRows] = await db.execute('SELECT * FROM Courses WHERE course_id = ? AND teacher_id = ?', [course_id, teacher_id]);
    if (courseRows.length === 0) {
      throw new Error('El curso no existe o no pertenece al profesor');
    }

    const [unitRows] = await db.execute('SELECT * FROM Units WHERE unit_id = ? AND course_id = ?', [unit_id, course_id]);
    if (unitRows.length === 0) {
      throw new Error('La unidad no existe o no pertenece al curso');
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();
 
    const [examResult] = await connection.execute(
      'INSERT INTO Exams (unit_id, course_id, title) VALUES (?, ?, ?)',
      [unit_id, course_id, title]
    );
 
    const exam_id = examResult.insertId;

    for (const question of questions) {
      const { question_text, answers } = question;
      const [questionResult] = await connection.execute(
        'INSERT INTO Questions (exam_id, question_text) VALUES (?, ?)',
        [exam_id, question_text]
      );
      const question_id = questionResult.insertId;

      for (const answer of answers) {
        const { answer_text, is_correct } = answer;
        await connection.execute(
          'INSERT INTO Answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)',
          [question_id, answer_text, is_correct]
        );
      }
    }

    await connection.commit();
    connection.release();
 
    return { message: 'Examen creado exitosamente', course: courseRows[0], unit: unitRows[0] };
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error al crear el examen:', error.message);
    throw new Error('Error al crear el examen');
  }
};


const uploadQuestionImage = async (question_id, imagePath) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [questionRows] = await connection.execute('SELECT * FROM Questions WHERE question_id = ?', [question_id]);
    if (questionRows.length === 0) {
      throw new Error('La pregunta no existe');
    }

    await new Promise((resolve, reject) => {
      scpClient.scp(imagePath, {
        host: remoteHost,
        username: remoteUser,
        password: remotePassword,
        path: remotePath
      }, (err) => {
        if (err) return reject(err);
        fs.unlinkSync(imagePath); // Eliminar el archivo temporal
        resolve();
      });
    });

    const remoteImagePath = path.join(remotePath, `${question_id}.jpg`);
    await connection.execute(
      'UPDATE Questions SET image_path = ? WHERE question_id = ?',
      [remoteImagePath, question_id]
    );

    await connection.commit();
    connection.release();

    return { message: 'Imagen subida exitosamente', image_path: remoteImagePath };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error al subir la imagen:', error.message);
    throw new Error('Error al subir la imagen');
  }
};

const listExamsWithDetails = async (student_id) => {
  try {
    const [exams] = await db.execute(`
      SELECT Exams.*, Courses.title as course_title, Units.unit_name as unit_name
      FROM Exams
      JOIN Courses ON Exams.course_id = Courses.course_id
      JOIN Units ON Exams.unit_id = Units.unit_id
      JOIN Enrollments ON Courses.course_id = Enrollments.course_id
      WHERE Enrollments.student_id = ?
    `, [student_id]);

    for (const exam of exams) {
      const [questions] = await db.execute('SELECT * FROM Questions WHERE exam_id = ?', [exam.exam_id]);
      exam.questions = questions;

      for (const question of questions) {
        const [answers] = await db.execute('SELECT * FROM Answers WHERE question_id = ?', [question.question_id]);
        question.answers = answers;

        if (question.image_path) {
          question.image_link = `http://${remoteHost}/images/${question.question_id}.jpg`;
        }
      }
    }

    return exams;
  } catch (error) {
    console.error('Error al listar los exámenes:', error);
    throw new Error('Error al listar los exámenes');
  }
};



const listExamsByCourseId = async (course_id) => {
  try {
    const [exams] = await db.execute('SELECT * FROM Exams WHERE course_id = ?', [course_id]);

    for (const exam of exams) {
      const [questions] = await db.execute('SELECT * FROM Questions WHERE exam_id = ?', [exam.exam_id]);
      exam.questions = questions;

      for (const question of questions) {
        const [answers] = await db.execute('SELECT * FROM Answers WHERE question_id = ?', [question.question_id]);
        question.answers = answers;

        // Only generate the link if image_path is not null
        if (question.image_path) {
          question.image_link = `http://${remoteHost}/images/${question.question_id}.jpg`;
        }
      }
    }

    return exams;
  } catch (error) {
    console.error('Error al listar los exámenes por curso:', error);
    throw new Error('Error al listar los exámenes por curso');
  }
};



const deleteExam = async (exam_id) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Eliminar las respuestas primero
    await connection.execute('DELETE FROM Answers WHERE question_id IN (SELECT question_id FROM Questions WHERE exam_id = ?)', [exam_id]);

    // Eliminar las preguntas
    await connection.execute('DELETE FROM Questions WHERE exam_id = ?', [exam_id]);

    // Eliminar el examen
    await connection.execute('DELETE FROM Exams WHERE exam_id = ?', [exam_id]);

    await connection.commit();
    connection.release();

    return { message: 'Examen eliminado exitosamente' };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error al eliminar el examen:', error.message);
    throw new Error('Error al eliminar el examen');
  }
};

const getExamById = async (exam_id, student_id) => {
  try {
    const [examRows] = await db.execute(`
      SELECT Exams.*, Courses.title as course_title, Units.unit_name as unit_name
      FROM Exams
      JOIN Courses ON Exams.course_id = Courses.course_id
      JOIN Units ON Exams.unit_id = Units.unit_id
      WHERE Exams.exam_id = ?
    `, [exam_id]);

    if (examRows.length === 0) {
      throw new Error('El examen no existe');
    }

    const exam = examRows[0];
    const [questions] = await db.execute('SELECT * FROM Questions WHERE exam_id = ?', [exam.exam_id]);
    exam.questions = questions;

    for (const question of questions) {
      const [answers] = await db.execute('SELECT * FROM Answers WHERE question_id = ?', [question.question_id]);
      question.answers = answers;

      if (question.image_path) {
        question.image_link = `http://${remoteHost}/images/${question.question_id}.jpg`;
      }
    }

 
    const [resultRows] = await db.execute('SELECT * FROM ExamResults WHERE exam_id = ? AND student_id = ?', [exam_id, student_id]);
    exam.isCompleted = resultRows.length > 0; 

    return exam;
  } catch (error) {
    console.error('Error al obtener el examen por ID:', error);
    throw new Error('Error al obtener el examen por ID');
  }
};


const submitExamAnswers = async (exam_id, student_id, answers) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {

    const [existingResults] = await connection.execute('SELECT * FROM ExamResults WHERE exam_id = ? AND student_id = ?', [exam_id, student_id]);
    if (existingResults.length > 0) {
      throw new Error('El estudiante ya ha completado este examen.');
    }

   
    const [questions] = await connection.execute('SELECT * FROM Questions WHERE exam_id = ?', [exam_id]);
    let correctAnswers = 0;
    let wrongAnswers = 0;

    for (const question of questions) {
      const studentAnswer = answers.find(answer => answer.question_id === question.question_id);

      if (studentAnswer) {
        const [answerRows] = await connection.execute('SELECT * FROM Answers WHERE question_id = ?', [question.question_id]);
        const correctAnswer = answerRows.find(row => row.answer_id === studentAnswer.answer_id);

        if (correctAnswer && correctAnswer.is_correct === 1) {
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      } else {
        wrongAnswers++;
      }
    }

    const totalScore = (correctAnswers / questions.length) * 20;

    await connection.execute(
      'INSERT INTO ExamResults (student_id, exam_id, correct_answers, wrong_answers, total_score) VALUES (?, ?, ?, ?, ?)',
      [student_id, exam_id, correctAnswers, wrongAnswers, totalScore]
    );

    await connection.commit();
    connection.release();

    return {
      message: 'Respuestas enviadas exitosamente',
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      total_score: totalScore,
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error al enviar las respuestas del examen:', error.message);
    throw error; 
  }
};


const listExamResults = async (exam_id) => {
  try {
    const [results] = await db.execute(
      'SELECT ExamResults.*, Students.first_name, Students.last_name FROM ExamResults JOIN Students ON ExamResults.student_id = Students.student_id WHERE exam_id = ?',
      [exam_id]
    );

    return results;
  } catch (error) {
    console.error('Error al listar los resultados del examen:', error);
    throw new Error('Error al listar los resultados del examen');
  }
};


const listExamResultsByStudentId = async (student_id) => {
  try {
    const [results] = await db.execute(`
      SELECT ExamResults.*, 
             Courses.title AS course_title, 
             Units.unit_name AS unit_name, 
             Exams.title AS exam_title 
      FROM ExamResults
      JOIN Exams ON ExamResults.exam_id = Exams.exam_id
      JOIN Courses ON Exams.course_id = Courses.course_id
      JOIN Units ON Exams.unit_id = Units.unit_id
      WHERE ExamResults.student_id = ?
    `, [student_id]);

    return results;
  } catch (error) {
    console.error('Error al listar los resultados del examen por estudiante:', error);
    throw new Error('Error al listar los resultados del examen por estudiante');
  }
};

const listAllExamResultsWithDetails = async () => {
  try {
    const [results] = await db.execute(`
      SELECT ExamResults.*, 
             Exams.title AS exam_title, 
             Courses.title AS course_title, 
             Units.unit_name, 
             Students.first_name, 
             Students.last_name,
             Grades.grade_name
      FROM ExamResults
      JOIN Exams ON ExamResults.exam_id = Exams.exam_id
      JOIN Courses ON Exams.course_id = Courses.course_id
      JOIN Units ON Exams.unit_id = Units.unit_id
      JOIN Students ON ExamResults.student_id = Students.student_id
      JOIN Grades ON Courses.grade_id = Grades.grade_id
    `);

    return results;
  } catch (error) {
    console.error('Error al listar todos los resultados de los exámenes:', error);
    throw new Error('Error al listar todos los resultados de los exámenes');
  }
};

module.exports = {
  createExam,
  uploadQuestionImage,
  listExamsWithDetails,
  listExamsByCourseId,
  deleteExam,
  getExamById,
  submitExamAnswers,
  listExamResults,
  listExamResultsByStudentId,
  listAllExamResultsWithDetails  

};
