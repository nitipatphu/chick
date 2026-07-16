const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  let statusCode = err.statusCode;
  if (statusCode === undefined) {
    statusCode = 500;
  }

  let message = err.message;
  if (message === undefined) {
    message = 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';
  }

  let stack = undefined;
  if (process.env.NODE_ENV === 'development') {
    stack = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: stack,
  });
};

module.exports = errorHandler;