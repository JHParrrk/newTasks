// index.js

const server = require("./server");
const router = require("./router");
const requestHandler = require("./requestHandler");
const dbPool = require("./database/connect/mariadb");

// 서버 시작 전 DB 연결 테스트
dbPool
  .getConnection()
  .then((conn) => {
    console.log("DB 연결 상태 이상 없음");
    conn.release();
  })
  .catch((err) => {
    console.error("DB 연결 실패! 서버를 시작할 수 없습니다.", err);
    process.exit(1);
  });

// 비동기 함수로 변경하여 핸들러 초기화가 완료될 때까지 기다립니다.
async function main() {
  const handle = await requestHandler.init();
  server.start(router.route, handle);
}

main();
