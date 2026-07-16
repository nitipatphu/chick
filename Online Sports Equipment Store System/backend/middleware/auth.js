const jwt = require('jsonwebtoken');

let SECRET_KEY = process.env.JWT_SECRET;
if (SECRET_KEY === undefined) {
  SECRET_KEY = 'your-secret-key-change-this';
}

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader === undefined || authHeader === null || authHeader === '') {
    return res.status(401).json({ 
      success: false, 
      error: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' 
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false, 
      error: 'Token ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user === undefined || req.user === null) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    let hasRole = false;
    for (let i = 0; i < roles.length; i++) {
      if (roles[i] === req.user.role) {
        hasRole = true;
      }
    }

    if (hasRole === false) {
      return res.status(403).json({ 
        success: false, 
        error: 'คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้' 
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };