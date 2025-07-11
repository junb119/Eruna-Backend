// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // 1. 헤더에서 Authorization 토큰 꺼내기
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "인증 토큰이 필요합니다." });
  }

  const token = authHeader.split(" ")[1]; // "Bearer [토큰]" → [1]만 가져오기

  try {
    // 2. 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. 사용자 정보 저장 (다음 미들웨어나 라우트 핸들러에서 사용 가능)
    req.user = decoded;

    next(); // 계속 진행
  } catch (err) {
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
}

module.exports = authMiddleware;
