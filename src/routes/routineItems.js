const express = require("express");
const router = express.Router();
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");
const optionalAuth = require("../middleware/optionalAuthMiddleware");
// ✅ 루틴 구성 운동 목록 조회
router.get("/:routineId", optionalAuth, async (req, res) => {
  const { routineId } = req.params;

  // 로그인 확인
  if (!req.user?.id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  // 루틴 소유자 확인
  const check = await pool.query(
    "SELECT * FROM routine WHERE id = $1 AND created_by = $2",
    [routineId, req.user.id]
  );

  if (check.rows.length === 0) {
    return res.status(403).json({ message: "조회 권한이 없습니다." });
  }

  // 루틴에 포함된 구성 항목 조회
  const result = await pool.query(
    `SELECT * FROM routine_item
     WHERE routine_id = $1
     ORDER BY "order" ASC`,
    [routineId]
  );

  return res.status(200).json({
    message: "루틴 구성 운동 목록 조회 성공",
    items: result.rows,
  });
});

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

// ✅ 구성 운동 수정
router.patch("/:itemId", optionalAuth, async (req, res) => {
  const { itemId } = req.params;
  const { order, set_count, rep_count, duration, distance, weight, note } =
    req.body;

  // 1. 로그인 확인
  if (!req.user?.id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  // 2. 소유자 확인: routine_item → routine → created_by 검사
  const check = await pool.query(
    `SELECT ri.*, r.created_by
     FROM routine_item ri
     JOIN routine r ON ri.routine_id = r.id
     WHERE ri.id = $1`,
    [itemId]
  );

  if (check.rows.length === 0) {
    return res.status(404).json({ message: "해당 항목을 찾을 수 없습니다." });
  }

  const item = check.rows[0];

  if (item.created_by !== req.user.id) {
    return res.status(403).json({ message: "수정 권한이 없습니다." });
  }

  // 3. 수정 실행
  const result = await pool.query(
    `UPDATE routine_item SET
      "order" = $1,
      set_count = $2,
      rep_count = $3,
      duration = $4,
      distance = $5,
      weight = $6,
      note = $7
     WHERE id = $8
     RETURNING *`,
    [
      order,
      set_count,
      rep_count,
      duration,
      distance,
      weight,
      note || "",
      itemId,
    ]
  );

  return res.status(200).json({
    message: "운동 항목이 수정되었습니다.",
    item: result.rows[0],
  });
});

// ✅ 구성 운동 항목 삭제
router.delete("/:itemId", optionalAuth, async (req, res) => {
  const { itemId } = req.params;

  // 1. 로그인 확인
  if (!req.user?.id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  // 2. 해당 아이템이 본인 루틴인지 확인
  const check = await pool.query(
    `SELECT ri.* FROM routine_item ri
     JOIN routine r ON ri.routine_id = r.id
     WHERE ri.id = $1 AND r.created_by = $2`,
    [itemId, req.user.id]
  );

  if (check.rows.length === 0) {
    return res.status(403).json({ message: "삭제 권한이 없습니다." });
  }

  // 3. 삭제 실행
  await pool.query("DELETE FROM routine_item WHERE id = $1", [itemId]);

  return res.status(200).json({ message: "운동 항목이 삭제되었습니다." });
});

module.exports = router;
