const express = require("express"); // Express 모듈 불러오기
require("dotenv").config(); /* .env 파일에 PORT=5000 같은 걸 쓰면, 여기서 process.env.PORT로 불러올 수 있음. React에서 .env.local 쓰는 거랑 똑같아! */

const pool = require("./db"); // DB 연결 객체 불러오기
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const routineRoutes = require("./routes/routines");

const app =
  express(); /* express()를 실행해서 app이라는 백엔드 앱을 만드는 거야.  이제 이 app으로 "페이지 만들기", "요청 처리" 등을 할 수 있음 */

const PORT = process.env.PORT || 5000; // 💡 사용할 포트를 설정함. .env에 없으면 5000번을 쓰겠다는 뜻이야.

app.use(express.json()); // 💡 요청 바디가 JSON이면 자동으로 JS 객체로 바꿔줌
// 클라이언트가 서버에 데이터를 보낼 때 application/json 형식이면
// 이 미들웨어 덕분에 req.body로 JS 객체처럼 바로 다룰 수 있음
// 리액트에서 useEffect(() => fetch(...)) 로 POST할 때, 서버는 이걸로 JSON 파싱해주는 거야

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes); // "/api/auth/login" 엔드포인트가 동작하게 함
app.use("/api/protected", protectedRoutes);
// 테스트용 기본 라우터
app.use("/api/routines", routineRoutes);
app.use("/api/routine-items", require("./routes/routineItems"));
app.use("/api/workout-categories", require("./routes/workoutCategories"));
app.use("/api/workout-types", require("./routes/workoutTypes"));

app.get("/", (req, res) => {
  res.send("Erona API is running 🚀");
});
// 💡 / 경로로 GET 요청이 오면 이 글자를 응답해주는 코드
// 프론트에서 <Route path="/" element={<Home />} /> 같은 느낌!
// 브라우저에서 localhost:5000에 접속하면 이 메시지를 보여주는 거야

// 서버 실행
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
// 💡 서버를 켜는 버튼!
// 실제로 5000번 포트에서 너의 백엔드 앱이 인터넷처럼 열린다는 뜻이야
// 리액트에서 npm run dev로 브라우저 띄우는 것처럼!

// 연결 테스트 (서버 실행 시 현재 시간 가져오기)
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("❌ DB 연결 실패:", err);
  } else {
    console.log("🟢 DB 연결 성공! 현재 시간:", result.rows[0].now);
  }
});
