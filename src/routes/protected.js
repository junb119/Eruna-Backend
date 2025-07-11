// routes/protected.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "인증된 사용자만 볼 수 있는 정보입니다.",
    user: req.user, // req.user는 authMiddleware가 넣어준 사용자 정보
  });
});

module.exports = router;

