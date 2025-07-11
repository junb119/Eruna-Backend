const jwt = require("jsonwebtoken");

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // 토큰 있으면 설정
    } catch (err) {
      console.warn("토큰 검증 실패 (무시하고 통과):", err);
    }
  }

  // 토큰 없거나 검증 실패해도 계속 진행
  next();
}

module.exports = optionalAuth;
