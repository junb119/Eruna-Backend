const express = require("express");
const router = express.Router(); // ✨ 새로운 라우터 객체 생성
const pool = require("../db"); // 📡 DB 연결 객체 가져오기
const { v4: uuidv4 } = require("uuid");

// 📍 GET /api/users 요청이 들어오면 실행됨
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users"); // DB에서 전체 유저 조회
    res.json(result.rows); // rows: 실제 유저 데이터 배열 → 클라이언트에 응답
  } catch (error) {
    console.log("❌ 유저 조회 실패:", error);
    res.status(500).json({ error: "서버 에러" });
  }
});

const bcrypt = require("bcrypt"); // 🔐 비밀번호 암호화를 위한 bcrypt 모듈
const saltRounds = 10; // 암호화 강도 설정 (보통 10이면 충분)

// POST /api/users → 회원가입
router.post("/", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // 1️⃣ 중복 이메일 체크
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "이미 가입된 이메일입니다." });
    }
    const id = uuidv4();
    // 2️⃣ 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3️⃣ 유저 생성 (id는 cuid처럼 직접 생성하거나 uuid 등으로 처리 가능. 지금은 단순 예시)

    const newUser = await pool.query(
      `INSERT INTO users (id, email, password, name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, name`,
      [id, email, hashedPassword, name]
    );

    res.status(201).json({ message: "회원가입 완료", user: newUser.rows[0] });
  } catch (err) {
    console.error("❌ 회원가입 실패:", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

module.exports = router; // 📤 index.js가 이 파일을 불러서 등록할 수 있게 내보냄
