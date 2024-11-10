const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  jwt.verify(token, 'rafita', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    req.user = decoded;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'No autorizado' });
};
const isall = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role==='student') {
    return next();
  }
  res.status(403).json({ message: 'No autorizado' });
};
module.exports = {
  isAuthenticated,
  isAdmin,
  isall
};
