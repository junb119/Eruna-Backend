const express = require("express");
const router = express.Router();
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");
const optionalAuth = require("../middleware/optionalAuthMiddleware");

// ✅ 구성 운동 추가 (로그인/비로그인 분기)
router.post("/:routineId", optionalAuth, async (req, res) => {
  const { routineId } = req.params;
  const {
    workout_id,
    order,
    set_count,
    rep_count,
    duration,
    distance,
    weight,
    note,
  } = req.body;

  const id = uuidv4();

  // ✅ 로그인 사용자: DB에 저장
  if (req.user?.id) {
    const check = await pool.query(
      "SELECT * FROM routine WHERE id = $1 AND created_by = $2",
      [routineId, req.user.id]
    );

    if (check.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "루틴에 추가할 권한이 없습니다." });
    }

    const result = await pool.query(
      `INSERT INTO routine_item (
        id, routine_id, workout_id, "order",
        set_count, rep_count, duration, distance, weight, note
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        id,
        routineId,
        workout_id,
        order,
        set_count,
        rep_count,
        duration,
        distance,
        weight,
        note || "",
      ]
    );

    return res.status(201).json({
      message: "운동 항목이 추가되었습니다.",
      item: result.rows[0],
    });
  }

  // ✅ 비로그인 사용자: 응답만 반환 (로컬에서 관리)
  const now = new Date().toISOString();
  return res.status(200).json({
    message: "비로그인 상태입니다. 운동 항목은 로컬에서 관리됩니다.",
    item: {
      id,
      routine_id: routineId,
      workout_id,
      order,
      set_count,
      rep_count,
      duration,
      distance,
      weight,
      note: note || "",
      created_at: now,
      is_guest: true,
    },
  });
});

module.exports = router;
