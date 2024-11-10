const db = require('../../config/db');
const remoteHost = '143.244.144.235';
const path = require('path');
const createUnit = async (unitData) => {
  const { course_id, unit_name } = unitData;

  // Verificar si el curso existe
  const [courseRows] = await db.execute('SELECT * FROM Courses WHERE course_id = ?', [course_id]);
  if (courseRows.length === 0) {
    throw new Error('El curso no existe');
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    await connection.execute(
      'INSERT INTO Units (course_id, unit_name) VALUES (?, ?)',
      [course_id, unit_name]
    );

    await connection.commit();
    connection.release();

    return { message: 'Unidad creada exitosamente' };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error al crear la unidad:', error);
    throw new Error('Error al crear la unidad');
  }
};
const listUnitsByCourse = async (course_id) => {
  const [units] = await db.execute('SELECT * FROM Units WHERE course_id = ?', [course_id]);

  const unitsWithDetails = await Promise.all(units.map(async (unit) => {
    const [exams] = await db.execute('SELECT * FROM Exams WHERE unit_id = ?', [unit.unit_id]);
    const [materials] = await db.execute('SELECT * FROM Materials WHERE unit_id = ?', [unit.unit_id]);
    
    const materialsWithLinks = materials.map(material => ({
      ...material,
      document_link: `http://${remoteHost}/images/${path.basename(material.path)}`
    }));

    return {
      ...unit,
      exams,
      materials: materialsWithLinks
    };
  }));

  return unitsWithDetails;
};
module.exports = {
  createUnit,
  listUnitsByCourse,
};
