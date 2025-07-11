// src/db.js

// ✅ pg 라이브러리에서 Pool(연결 풀) 객체를 불러온다
// → Pool은 DB와 연결할 때 쓰는 기본적인 도구예요.
// → 프론트엔드의 fetch처럼, 이걸로 DB에 요청(query)을 보낼 수 있어요.
const { Pool } = require('pg');

// ✅ .env 파일을 불러와서 환경변수(process.env)를 사용할 수 있게 한다
// → DATABASE_URL 같은 민감한 정보(DB 주소, 비밀번호)는 여기서 관리해요.
require('dotenv').config();

// ✅ Pool 객체를 생성한다
// → 이 Pool은 DB 연결을 관리해주는 객체예요.
// → 내부적으로는 연결을 "미리 만들어 놓고", 요청이 오면 빌려주는 구조예요.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // .env에 있는 DB 주소를 읽어옴
  // 예: postgresql://postgres:1234@localhost:5432/erona
});

// ✅ 다른 파일에서도 이 pool 객체를 사용할 수 있도록 내보낸다
// → index.js나 API 라우터 등에서 DB 쿼리할 때 이걸 import해서 사용함
module.exports = pool;
