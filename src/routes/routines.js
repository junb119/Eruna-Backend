// routes/routines.js

const express = require("express");
const router = express.Router(); // ✅ 이 줄이 반드시 먼저 와야 합니다
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
    return res
      .status(200)
      .json({ message: "루틴 목록을 불러왔습니다.", routines: result.rows });
  }
  // 비로그인
  return res.status(200).json({
    message: "비로그인 상태입니다. 클라이언트에서 직접 관리해야합니다.",
    routines: [],
  });
});

