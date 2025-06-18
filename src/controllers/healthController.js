export const healthCheck = (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: '서버가 정상적으로 동작 중입니다.',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}; 