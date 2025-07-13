const express = require("express");
const router = express.Router();
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");
const optionalAuth = require("../middleware/optionalAuthMiddleware");

// ✅ 운동 타입 추가
router.post("/", optionalAuth, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "운동 타입 이름은 필수입니다." });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  // 로그인 사용자: DB 저장
  if (req.user?.id) {
    const result = await pool.query(
      `INSERT INTO workout_type (id, name, created_by, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, name, req.user.id, now]
    );

    return res.status(201).json({
      message: "운동 타입이 추가되었습니다 (로그인 상태)",
      type: result.rows[0]
    });
  }

  // 비로그인 사용자: 응답만
  return res.status(200).json({
    message: "비로그인 상태입니다. 운동 타입은 로컬에서 관리됩니다.",
    type: {
      id,
      name,
      created_by: null,
      created_at: now,
      is_guest: true
    }
  });
});

module.exports = router;

