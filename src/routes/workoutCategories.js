const express = require("express");
const router = express.Router();
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");
const optionalAuth = require("../middleware/optionalAuthMiddleware");

// ✅ 카테고리 추가
router.post("/", optionalAuth, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "카테고리 이름은 필수입니다." });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  // 🔐 로그인 사용자: DB에 저장
  if (req.user?.id) {
    const result = await pool.query(
      `INSERT INTO workout_category (id, name, created_by, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, name, req.user.id, now]
    );

    return res.status(201).json({
      message: "카테고리가 추가되었습니다 (로그인 상태)",
      category: result.rows[0],
    });
  }

  // 🚫 비로그인 사용자: 응답만
  return res.status(200).json({
    message: "비로그인 상태입니다. 카테고리는 로컬에서 관리됩니다.",
    category: {
      id,
      name,
      created_by: null,
      created_at: now,
      is_guest: true,
    },
  });
});

module.exports = router;
