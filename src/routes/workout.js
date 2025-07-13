const express = require("express");
const router = express.Router();
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");
const optionalAuth = require("../middleware/optionalAuthMiddleware");

// ✅ 운동 목록 조회
router.get("/", optionalAuth, async (req, res) => {
  // 🔐 로그인 사용자
  if (req.user?.id) {
    const result = await pool.query(
      `SELECT w.*,
              c.name AS category_name,
              t.name AS type_name
         FROM workout w
    LEFT JOIN workout_category c ON w.category_id = c.id
    LEFT JOIN workout_type t     ON w.type_id = t.id
        WHERE w.created_by = $1
     ORDER BY w.name ASC`,
      [req.user.id]
    );

    return res.status(200).json({
      message: "운동 목록을 불러왔습니다 (로그인 상태)",
      workouts: result.rows,
    });
  }

  // 🚫 비로그인 사용자
  return res.status(200).json({
    message: "비로그인 상태입니다. 운동 목록은 클라이언트에서 관리됩니다.",
    workouts: [],
    is_guest: true,
  });
});

// ✅ 운동 추가
router.post("/", optionalAuth, async (req, res) => {
  const { name, category_id, type_id } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();

  if (!name) {
    return res.status(400).json({ message: "운동 이름은 필수입니다." });
  }

  // 🔐 로그인 유저 → DB 저장
  if (req.user?.id) {
    const result = await pool.query(
      `INSERT INTO workout (
         id, name, category_id, type_id, created_by, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, name, category_id || null, type_id || null, req.user.id, now]
    );

    return res.status(201).json({
      message: "운동이 추가되었습니다 (로그인 상태)",
      workout: result.rows[0],
    });
  }

  // 🚫 비로그인 유저 → 로컬 저장용 데이터만 반환
  return res.status(200).json({
    message: "비로그인 상태입니다. 운동은 클라이언트에서 관리됩니다.",
    workout: {
      id,
      name,
      category_id: category_id || null,
      type_id: type_id || null,
      created_by: null,
      created_at: now,
      is_guest: true,
    },
  });
});
// ✅ 운동 수정
router.patch("/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;
  const { name, category_id, type_id } = req.body;

  // 1. 인증 확인
  if (!req.user?.id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  // 2. 인가 확인 (본인 소유 운동인지)
  const check = await pool.query(
    "SELECT * FROM workout WHERE id = $1 AND created_by = $2",
    [id, req.user.id]
  );

  if (check.rows.length === 0) {
    return res.status(403).json({ message: "수정 권한이 없습니다." });
  }

  // 3. 수정 실행
  const result = await pool.query(
    `UPDATE workout
     SET name = $1,
         category_id = $2,
         type_id = $3
     WHERE id = $4
     RETURNING *`,
    [name, category_id || null, type_id || null, id]
  );

  return res.status(200).json({
    message: "운동이 수정되었습니다.",
    workout: result.rows[0],
  });
});
js;

// ✅ 운동 삭제
router.delete("/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;

  // 1. 인증
  if (!req.user?.id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  // 2. 인가 (본인 운동인지 확인)
  const check = await pool.query(
    "SELECT * FROM workout WHERE id = $1 AND created_by = $2",
    [id, req.user.id]
  );

  if (check.rows.length === 0) {
    return res.status(403).json({ message: "삭제 권한이 없습니다." });
  }

  // 3. 삭제 실행
  await pool.query("DELETE FROM workout WHERE id = $1", [id]);

  return res.status(200).json({ message: "운동이 삭제되었습니다." });
});

module.exports = router;
