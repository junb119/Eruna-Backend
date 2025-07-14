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
      type: result.rows[0],
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
      is_guest: true,
    },
  });
});
// ✅ 운동 타입 목록 조회
router.get("/", optionalAuth, async (req, res) => {
  if (req.user?.id) {
    const result = await pool.query(
      `SELECT * FROM workout_type
       WHERE created_by = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      message: "운동 타입 목록을 불러왔습니다.",
      types: result.rows,
    });
  }

  // 비로그인 사용자
  return res.status(200).json({
    message: "비로그인 상태입니다. 운동 타입은 로컬에서 관리됩니다.",
    types: [],
    is_guest: true,
  });
});

// ✅ 운동 타입 수정
router.patch("/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!req.user?.id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  // 본인 타입인지 확인
  const check = await pool.query(
    "SELECT * FROM workout_type WHERE id = $1 AND created_by = $2",
    [id, req.user.id]
  );

  if (check.rows.length === 0) {
    return res.status(403).json({ message: "수정 권한이 없습니다." });
  }

  // 수정 실행
  const result = await pool.query(
    `UPDATE workout_type
     SET name = $1
     WHERE id = $2
     RETURNING *`,
    [name, id]
  );

  return res.status(200).json({
    message: "운동 타입이 수정되었습니다.",
    type: result.rows[0],
  });
});
// ✅ 운동 타입 삭제
router.delete("/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;

  if (!req.user?.id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  // 본인 소유인지 확인
  const check = await pool.query(
    "SELECT * FROM workout_type WHERE id = $1 AND created_by = $2",
    [id, req.user.id]
  );

  if (check.rows.length === 0) {
    return res.status(403).json({ message: "삭제 권한이 없습니다." });
  }

  // 삭제 실행
  await pool.query("DELETE FROM workout_type WHERE id = $1", [id]);

  return res.status(200).json({ message: "운동 타입이 삭제되었습니다." });
});

module.exports = router;
