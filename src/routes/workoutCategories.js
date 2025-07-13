const express = require("express");
const router = express.Router();
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");
const optionalAuth = require("../middleware/optionalAuthMiddleware");

// ✅ 카테고리 목록 조회
router.get("/", optionalAuth, async (req, res) => {
  // 🔐 로그인 사용자
  if (req.user?.id) {
    const result = await pool.query(
      `SELECT * FROM workout_category
       WHERE created_by = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      message: "카테고리 목록을 불러왔습니다.",
      categories: result.rows,
    });
  }

  // 🚫 비로그인 사용자
  return res.status(200).json({
    message: "비로그인 상태입니다. 카테고리는 클라이언트에서 관리됩니다.",
    categories: [],
    is_guest: true,
  });
});

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
// ✅ 카테고리 수정
router.patch("/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  // 1. 로그인 확인
  if (!req.user?.id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  // 2. 본인 카테고리인지 확인
  const check = await pool.query(
    "SELECT * FROM workout_category WHERE id = $1 AND created_by = $2",
    [id, req.user.id]
  );

  if (check.rows.length === 0) {
    return res.status(403).json({ message: "수정 권한이 없습니다." });
  }

  // 3. 수정 실행
  const result = await pool.query(
    "UPDATE workout_category SET name = $1 WHERE id = $2 RETURNING *",
    [name, id]
  );

  return res.status(200).json({
    message: "카테고리가 수정되었습니다.",
    category: result.rows[0],
  });
});
// ✅ 카테고리 삭제
router.delete("/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;

  // 1. 로그인 확인
  if (!req.user?.id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  // 2. 본인 소유 확인
  const check = await pool.query(
    "SELECT * FROM workout_category WHERE id = $1 AND created_by = $2",
    [id, req.user.id]
  );

  if (check.rows.length === 0) {
    return res.status(403).json({ message: "삭제 권한이 없습니다." });
  }

  // 3. 삭제 실행
  await pool.query("DELETE FROM workout_category WHERE id = $1", [id]);

  return res.status(200).json({ message: "카테고리가 삭제되었습니다." });
});

module.exports = router;
