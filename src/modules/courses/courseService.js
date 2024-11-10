const db = require('../../config/db');

const createCourse = async (courseData) => {
  const { title, description, grade_id, teacher_id } = courseData;

  const [teacherRows] = await db.execute('SELECT * FROM Teachers WHERE teacher_id = ?', [teacher_id]);
  if (teacherRows.length === 0) {
    throw new Error('El ID del profesor proporcionado no existe');
  }

  const [gradeRows] = await db.execute('SELECT * FROM Grades WHERE grade_id = ?', [grade_id]);
  if (gradeRows.length === 0) {
    throw new Error('El ID del grado proporcionado no existe');
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    await connection.execute(
      'INSERT INTO Courses (title, description, grade_id, teacher_id) VALUES (?, ?, ?, ?)',
      [title, description, grade_id, teacher_id]
    );

    await connection.commit();
    connection.release();

    return { title, description, grade_id, teacher_id };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error al crear el curso:', error);
    throw new Error('Error al crear el curso');
  }
};

const listCoursesByTeacher = async (teacher_id) => {
  try {
    const [courses] = await db.execute('SELECT * FROM Courses WHERE teacher_id = ?', [teacher_id]);

    for (const course of courses) {
      const [units] = await db.execute('SELECT * FROM Units WHERE course_id = ?', [course.course_id]);
      course.units = units;
    }

    return courses;
  } catch (error) {
    console.error('Error al listar los cursos:', error);
    throw new Error('Error al listar los cursos');
  }
};


const listAllCourses = async (userId, role) => {
  try {
    let courses;
    if (role === 'admin') {
      // Si el usuario es un profesor (admin), listar todos los cursos
      [courses] = await db.execute('SELECT * FROM Courses');
    } else {
      // Si el usuario es un estudiante, listar solo los cursos de su grado
      const [studentRows] = await db.execute('SELECT grade_id FROM Students WHERE user_id = ?', [userId]);
      if (studentRows.length === 0) {
        throw new Error('El usuario no es un estudiante');
      }
      const gradeId = studentRows[0].grade_id;

      [courses] = await db.execute('SELECT * FROM Courses WHERE grade_id = ?', [gradeId]);

      // Añadir información de matrícula
      for (const course of courses) {
        const [enrollmentRows] = await db.execute(
          'SELECT * FROM Enrollments WHERE student_id = (SELECT student_id FROM Students WHERE user_id = ?) AND course_id = ?',
          [userId, course.course_id]
        );
        course.is_enrolled = enrollmentRows.length > 0;
      }
    }

    return courses;
  } catch (error) {
    console.error('Error al listar todos los cursos:', error);
    throw new Error('Error al listar todos los cursos');
  }
};

const enrollInCourse = async (user_id, course_id) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {

    const [studentRows] = await connection.execute('SELECT student_id FROM Students WHERE user_id = ?', [user_id]);
    if (studentRows.length === 0) {
      throw new Error('El usuario no es un estudiante');
    }
    const student_id = studentRows[0].student_id;

    const [courseRows] = await connection.execute('SELECT * FROM Courses WHERE course_id = ?', [course_id]);
    if (courseRows.length === 0) {
      throw new Error('El curso no existe');
    }
    const course = courseRows[0];

 
    const [enrollmentRows] = await connection.execute('SELECT * FROM Enrollments WHERE student_id = ? AND course_id = ?', [student_id, course_id]);
    if (enrollmentRows.length > 0) {
      throw new Error('El estudiante ya está matriculado en este curso');
    }


    await connection.execute('INSERT INTO Enrollments (student_id, course_id) VALUES (?, ?)', [student_id, course_id]);


    const [teacherRows] = await connection.execute('SELECT * FROM Teachers WHERE teacher_id = ?', [course.teacher_id]);
    const teacher = teacherRows[0];

    await connection.commit();
    connection.release();

    return { course, teacher };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error al matricularse en el curso:', error);
    throw new Error(error);
  }
};

const listEnrolledCoursesWithUnits = async (user_id) => {
  const connection = await db.getConnection();

  try {

    const [studentRows] = await connection.execute('SELECT student_id FROM Students WHERE user_id = ?', [user_id]);
    if (studentRows.length === 0) {
      throw new Error('El usuario no es un estudiante');
    }
    const student_id = studentRows[0].student_id;

   
    const [enrolledCourses] = await connection.execute(
      `SELECT c.course_id, c.title, c.description, c.teacher_id 
       FROM Enrollments e 
       JOIN Courses c ON e.course_id = c.course_id 
       WHERE e.student_id = ?`, 
      [student_id]
    );


    for (let course of enrolledCourses) {
      const [units] = await connection.execute('SELECT * FROM Units WHERE course_id = ?', [course.course_id]);
      course.units = units;
    }

    connection.release();
    return enrolledCourses;
  } catch (error) {
    connection.release();
    console.error('Error al listar los cursos matriculados con unidades:', error);
    throw  Error(error);
  }
};


const updateCourse = async (course_id, courseData) => {
  const { title, description } = courseData;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
   
    const [courseRows] = await connection.execute('SELECT * FROM Courses WHERE course_id = ?', [course_id]);
    if (courseRows.length === 0) {
      throw new Error('El curso no existe');
    }

    const [result] = await connection.execute(
      'UPDATE Courses SET title = ?, description = ? WHERE course_id = ?',
      [title, description, course_id]
    );

    await connection.commit();
    connection.release();

    return { course_id, title, description };
  } catch (error) {
    await connection.rollback();
    connection.release();
    // console.error('Error al actualizar el curso:', error);
    throw new Error(error.message);
  }
};
module.exports = {
  createCourse,
  listCoursesByTeacher,
  listAllCourses,
  enrollInCourse,
  listEnrolledCoursesWithUnits,
  updateCourse
};
