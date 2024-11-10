const libraryService = require('./libraryService');

const createLibraryDocument = async (req, res) => {
  try {
    const documentData = req.body;
    const file = req.file;
    const teacher_id = req.user.teacher_id;
    const result = await libraryService.createLibraryDocument(documentData, file, teacher_id);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listLibraryDocumentsByCourse = async (req, res) => {
  try {
    const { course_id } = req.params;
    const result = await libraryService.listLibraryDocumentsByCourse(course_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listLibraryDocumentsByUser = async (req, res) => {
  try {
    const userId = req.user.id; // ID del usuario
    const role = req.user.role; // Rol del usuario (admin o student)
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await libraryService.listLibraryDocumentsByUser(userId, role, page, limit, search);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateLibraryDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const documentData = req.body;
    const file = req.file;
    const result = await libraryService.updateLibraryDocument(documentId, documentData, file);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const deleteLibraryDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const result = await libraryService.deleteLibraryDocument(documentId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



module.exports = {
  createLibraryDocument,
  listLibraryDocumentsByCourse,
  listLibraryDocumentsByUser,
  updateLibraryDocument,
  deleteLibraryDocument,
   
  
};
