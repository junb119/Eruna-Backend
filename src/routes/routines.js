// routes/routines.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");
const optionalAuth = require("../middleware/optionalAuthMiddleware");

// 루틴 생성
router.post("/", optionalAuth, async (req, res) => {
  const { name, description, is_public } = req.body;

  // 로그인 상태인 경우 (토큰 있음)
  if (req.user?.id) {
    const userId = req.user.id;
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO routine (id, name, description, created_by, is_public, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING *`,
      [id, name, description || "", userId, is_public || false, now]
    );

    return res.status(201).json({
      message: "루틴이 저장되었습니다 (로그인 상태)",
      routine: result.rows[0],
    });
  }

  // 비로그인
  const guestId = req.body.guest_id || null;
  const id = uuidv4();
  const now = new Date().toISOString();
  return res.status(200).json({
    message: "비로그인 상태입니다. 루틴은 브라우저에서 관리됩니다.",
    routine: {
      id,
      name,
      description: description || "",
      is_public: is_public || false,
      created_by: guestId,
      created_at: now,
      is_guest: true,
    },
  });
});

module.exports = router;

// 루틴 목록 조회
router.get("/", optionalAuth, async (req, res) => {
  if (req.user?.id) {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT * FROM routine WHERE created_by = $1 ORDER BY created_at DESC",
      [userId]
    );
    return res.status(200).json({
      message: "루틴 목록을 불러왔습니다.",
      routines: result.rows,
    });
  }

  // 비로그인
  return res.status(200).json({
    message: "비로그인 상태입니다. 클라이언트에서 직접 관리해야 합니다.",
    routines: [],
  });
});

// 루틴 상세 내용 조회 api
router.get("/:id", optionalAuth, async (req, res) => {
  const routineId = req.params.id;

  if (req.user?.id) {
    const result = await pool.query(
      "SELECT * FROM routine WHERE id = $1 AND created_by = $2",
      [routineId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "루틴을 찾을 수 없습니다." });
    }

    return res.status(200).json({
      message: "루틴 상세 조회 성공",
      routine: result.rows[0],
    });
  }

  // 비로그인 사용자는 상세 조회 제한
  return res.status(401).json({
    message: "로그인 후에만 루틴 상세 조회가 가능합니다.",
  });
});

router.patch("/:id", optionalAuth, async (req, res) => {
  const { routindId } = req.params;
  const { name, description, is_public } = req.body;

  if (!req.user?.id) {
    return res.status(401).json({ message: "로그인이 필요합니다" });
  }

  const check = await pool.query(
    "SELECT * FROM routine WHERE id= $1 AND created_by =$2",
    [routindId, req.user.id]
  );
  if (check.rows.length === 0) {
    return res.status(403).json({ message: "수정 권한이 없습니다." });
  }

  const now = new Date().toISOString();
  const result = await pool.query(
    "UPDATE routine SET name = $1 , description = $2, is_public = $3, updated_at = $4 WHERE id = $5 RETURNING *",
    [name, description, is_public, now, id]
  );

  return res.status(200).json({
    message: "루틴이 수정되었습니다",
    routine: result.rows[0],
  });
});
