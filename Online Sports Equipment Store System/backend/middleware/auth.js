const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-this';


const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
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
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้' 
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };