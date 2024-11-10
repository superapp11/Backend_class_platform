const db = require('../../config/db');
const scpClient = require('scp2');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');

const remoteHost = '143.244.144.235';
const remoteUser = 'root';
const remotePassword = 'Sys4Log$$sa';
const remotePath = '/var/www/images';

const createMaterial = async (materialData, file, teacher_id) => {
  const { unit_id, course_id, title, description } = materialData;
  const extension = path.extname(file.originalname).substring(1); // Obtener la extensión del archivo y quitar el punto
  const fileName = `${file.filename}.${extension}`;
  const documentPath = path.join(file.destination, fileName);

  try {
    // Renombrar el archivo temporal para incluir la extensión
    fs.renameSync(file.path, documentPath);

    // Verificar si la unidad y el curso existen
    const [unitRows] = await db.execute('SELECT * FROM Units WHERE unit_id = ? AND course_id = ?', [unit_id, course_id]);
    if (unitRows.length === 0) {
      throw new Error('La unidad o el curso no existen');
    }

    const [courseRows] = await db.execute('SELECT * FROM Courses WHERE course_id = ? AND teacher_id = ?', [course_id, teacher_id]);
    if (courseRows.length === 0) {
      throw new Error('El curso no pertenece al profesor');
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    const remoteDocumentPath = path.join(remotePath, fileName);
    await new Promise((resolve, reject) => {
      scpClient.scp(documentPath, {
        host: remoteHost,
        username: remoteUser,
        password: remotePassword,
        path: remotePath
      }, (err) => {
        if (err) return reject(err);
        fs.unlinkSync(documentPath); // Eliminar el archivo temporal
        resolve();
      });
    });

    const [materialResult] = await connection.execute(
      'INSERT INTO Materials (unit_id, course_id, title, description, path, extension) VALUES (?, ?, ?, ?, ?, ?)',
      [unit_id, course_id, title, description, remoteDocumentPath, extension]
    );

    await connection.commit();
    connection.release();

    return { message: 'Material creado exitosamente', material_id: materialResult.insertId };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error al crear el material:', error.message);
    throw new Error('Error al crear el material');
  }
};

const listMaterialsByUnit = async (unit_id) => {
  const [materials] = await db.execute('SELECT * FROM Materials WHERE unit_id = ?', [unit_id]);

  const materialsWithLinks = materials.map(material => ({
    ...material,
    document_link: `http://${remoteHost}/images/${path.basename(material.path)}`
  }));

  return materialsWithLinks;
};

const deleteMaterial = async (materialId) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Primero obtenemos la ruta del documento para eliminar el archivo
    const [rows] = await connection.execute('SELECT path FROM Materials WHERE material_id = ?', [materialId]);
    const documentPath = rows[0]?.path;

    if (documentPath) {
      // Asegurarse de que la ruta del documento sea correcta
      const fullDocumentPath = path.posix.join(remotePath, path.basename(documentPath));

      console.log('Ruta del archivo a eliminar:', fullDocumentPath);

      // Eliminar el archivo del servidor remoto usando ssh2
      await new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
          conn.exec(`rm ${fullDocumentPath}`, (err, stream) => {
            if (err) {
              conn.end();
              return reject(err);
            }
            stream.on('close', (code, signal) => {
              conn.end();
              if (code !== 0) {
                return reject(new Error(`Failed to remove file, exit code ${code}`));
              }
              resolve();
            });
          });
        }).connect({
          host: remoteHost,
          port: 22,
          username: remoteUser,
          password: remotePassword,
        });
      });
    }

    // Eliminar el registro de la base de datos
    const deleteQuery = 'DELETE FROM Materials WHERE material_id = ?';
    await connection.execute(deleteQuery, [materialId]);

    await connection.commit();

    return { message: 'Material eliminado exitosamente' };
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error al eliminar el material:', error.message);
    throw new Error('Error al eliminar el material');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  createMaterial,
  listMaterialsByUnit,
  deleteMaterial,
};
