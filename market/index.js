// market/index.js
// (지휘 본부): 모든 부품(모듈)을 조립하고 서버 가동을 명령하는 총책임자입니다.

// 1. 각자의 역할이 정의된 모듈(부품)들을 불러옵니다.
const server = require("./server"); // 서버 기능
const router = require("./router"); // 경로 탐색 기능
const requestHandler = require("./requestHandler"); // 실제 작업 내용
const dbPool = require("./database/connect/mariadb"); // DB 연결 풀

// (선택사항) 서버 시작 전 DB 연결 테스트
dbPool
  .getConnection()
  .then((conn) => {
    console.log("DB 연결 상태 이상 없음");
    conn.release(); // 확인 후 연결은 다시 풀에 반납
  })
  .catch((err) => {
    console.error("DB 연결 실패! 서버를 시작할 수 없습니다.", err);
    process.exit(1); // DB 연결 안되면 서버 종료
  });

// 2. 서버를 시작시킵니다.
// 서버를 켜는 `start` 함수에 두 가지 중요한 정보를 전달합니다.
// 첫째, 경로를 찾아줄 `router.route` 함수.
// 둘째, 경로와 담당자가 짝지어진 `requestHandler.handle` 목록.
// 이로써 서버는 "누가 길을 알려줄지"와 "길 끝에 누가 일하는지"를 알게 됩니다.
server.start(router.route, requestHandler.handle);
