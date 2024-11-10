const materialService = require('./materialService');

const createMaterial = async (req, res) => {
  try {
    const materialData = req.body;
    const file = req.file;
    const teacher_id = req.user.teacher_id;
    const result = await materialService.createMaterial(materialData, file, teacher_id);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listMaterialsByUnit = async (req, res) => {
  const { unit_id } = req.params;

  try {
    const materials = await materialService.listMaterialsByUnit(unit_id);
    res.status(200).json({
      message: 'Materiales obtenidos exitosamente',
      status: true,
      data: materials,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el servidor',
      status: false,
      error: error.message,
    });
  }
};

const deleteMaterial = async (req, res) => {
  const { material_id } = req.params;

  try {
    const result = await materialService.deleteMaterial(material_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el material', error: error.message });
  }
};

module.exports = {
  createMaterial,
  listMaterialsByUnit,
  deleteMaterial,
};
