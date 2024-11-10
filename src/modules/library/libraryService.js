const db = require('../../config/db');
const scpClient = require('scp2');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const remoteHost = '143.244.144.235';
const remoteUser = 'root';
const remotePassword = 'Sys4Log$$sa';
const remotePath = '/var/www/images';

const createLibraryDocument = async (documentData, file, teacher_id) => {
  const { course_id, document_title, document_description } = documentData;
  const documentPath = file.path;
  const extension = path.extname(file.originalname).substring(1); // Obtener la extensión del archivo y quitar el punto

  try {
    const [courseRows] = await db.execute('SELECT * FROM Courses WHERE course_id = ? AND teacher_id = ?', [course_id, teacher_id]);
    if (courseRows.length === 0) {
      throw new Error('El curso no existe o no pertenece al profesor');
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    const remoteDocumentPath = path.join(remotePath, `${file.filename}`);
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

    const [libraryResult] = await connection.execute(
      'INSERT INTO Library (course_id, document_title, document_description, document_path, extension) VALUES (?, ?, ?, ?, ?)',
      [course_id, document_title, document_description, remoteDocumentPath, extension]
    );

    await connection.commit();
    connection.release();

    return { message: 'Material de trabajo creado exitosamente', library_id: libraryResult.insertId };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error al crear el material de trabajo:', error.message);
    throw new Error('Error al crear el material de trabajo');
  }
};

const listLibraryDocumentsByCourse = async (course_id) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Library WHERE course_id = ?', [course_id]);

    if (rows.length === 0) {
      return { message: 'No se encontraron materiales de trabajo para este curso' };
    }

    const documents = rows.map(doc => ({
      ...doc,
      document_link: `http://${remoteHost}/images/${path.basename(doc.document_path)}`
    }));

    return { documents };
  } catch (error) {
    console.error('Error al listar los materiales de trabajo:', error.message);
    throw new Error('Error al listar los materiales de trabajo');
  }
};

const listLibraryDocumentsByUser = async (user_id, role, page = 1, limit = 10, search = '') => {
  try {
    const offset = (page - 1) * limit;
    let query = '';
    let countQuery = '';

    if (role === 'admin') {
      query = `
        SELECT Library.*
        FROM Library 
        WHERE (Library.document_description LIKE ? OR Library.document_title LIKE ?)
        LIMIT ${limit} OFFSET ${offset}
      `;

      countQuery = `
        SELECT COUNT(*) as total
        FROM Library 
        WHERE (Library.document_description LIKE ? OR Library.document_title LIKE ?)
      `;
   
    } else if (role === 'student') {
      query = `
        SELECT Library.*
        FROM Library 
        WHERE (Library.document_description LIKE ? OR Library.document_title LIKE ?)
        LIMIT ${limit} OFFSET ${offset}
      `;

      countQuery = `
        SELECT COUNT(*) as total
        FROM Library 
        WHERE (Library.document_description LIKE ? OR Library.document_title LIKE ?)
      `;
    }

    const searchParam = `%${search}%`;
    console.log('Consulta SQL:', query);

    const [rows] = await db.execute(query, [searchParam, searchParam]);
    const [countRows] = await db.execute(countQuery, [searchParam, searchParam]);

    if (rows.length === 0) {
      return { message: 'No se encontraron materiales de trabajo para este usuario' };
    }

    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    const documents = rows.map(doc => ({
      ...doc,
      document_link: `http://${remoteHost}/images/${path.basename(doc.document_path)}`
    }));

    return { documents, totalPages };
  } catch (error) {
    console.error('Error al listar los materiales de trabajo por usuario:', error.message);
    throw new Error('Error al listar los materiales de trabajo por usuario');
  }
};

const updateLibraryDocument = async (documentId, documentData, file) => {
  const { course_id, document_title, document_description } = documentData;
  const extension = file ? path.extname(file.originalname).substring(1) : null; // Obtener la extensión del archivo si existe

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    let updateQuery = 'UPDATE Library SET course_id = ?, document_title = ?, document_description = ?';
    const updateParams = [course_id, document_title, document_description];

    if (file) {
      const documentPath = file.path;
      const remoteDocumentPath = path.join(remotePath, `${file.filename}`);

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

      updateQuery += ', document_path = ?, extension = ?';
      updateParams.push(remoteDocumentPath, extension);
    }

    updateQuery += ' WHERE library_id = ?';
    updateParams.push(documentId);

    await connection.execute(updateQuery, updateParams);

    await connection.commit();
    connection.release();

    return { message: 'Material de trabajo actualizado exitosamente' };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error al actualizar el material de trabajo:', error.message);
    throw new Error('Error al actualizar el material de trabajo');
  }
};

const deleteLibraryDocument = async (documentId) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Primero obtenemos la ruta del documento para eliminar el archivo
    const [rows] = await connection.execute('SELECT document_path FROM Library WHERE library_id = ?', [documentId]);
    const documentPath = rows[0]?.document_path;

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
    const deleteQuery = 'DELETE FROM Library WHERE library_id = ?';
    await connection.execute(deleteQuery, [documentId]);

    await connection.commit();

    return { message: 'Material de trabajo eliminado exitosamente' };
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error al eliminar el material de trabajo:', error.message);
    throw new Error('Error al eliminar el material de trabajo');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};



module.exports = {
  createLibraryDocument,
  listLibraryDocumentsByCourse,
  listLibraryDocumentsByUser,
  updateLibraryDocument,
  deleteLibraryDocument,
   
};
