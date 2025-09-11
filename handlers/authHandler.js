const dbPool = require("../database/connect/mariadb"); // db
const { formatDate } = require("../commons/libraries/utils/formDate.js");

module.exports = {
  login: async function (response, login_view) {
    console.log("login 핸들러: 로그인 페이지 요청");

    if (!login_view) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류: 상세페이지 템플릿을 로드할 수 없습니다.");
      return;
    }

    try {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(login_view);
      response.end();
    } catch (err) {
      console.error("login 핸들러 에러:", err);
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류가 발생했습니다.");
    }
    // 추후에 POST /login 처리 로직 추가 예정
  },
  registration: async function (
    response,
    email,
    password,
    name,
    registration_view,
    method = "GET"
  ) {
    console.log(`registration 핸들러: ${method} 요청`);

    // 1. GET: 폼만 보여줌
    if (method === "GET") {
      if (!registration_view) {
        response.writeHead(500, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end("서버 오류: 상세페이지 템플릿을 로드할 수 없습니다.");
        return;
      }
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(registration_view);
      response.end();
      return;
    }

    // 2. POST: DB INSERT
    if (method === "POST") {
      try {
        const formattedDate = formatDate(new Date());
        const sql =
          "INSERT INTO users (email, password, name, created_at) VALUES (?, ?, ?, ?)";
        const params = [email, password, name, formattedDate];

        const [result] = await dbPool.query(sql, params);
        console.log("회원가입 결과:", result);

        // 회원가입 성공 시 알림 + 이동
        const successScript = `
          <script>
            alert("회원가입 성공!");
            window.location.href = "/concerts";
          </script>
        `;
        let html = registration_view;
        if (html && html.includes("</body>")) {
          html = html.replace("</body>", successScript + "</body>");
        } else {
          html += successScript;
        }

        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.write(html);
        response.end();
      } catch (err) {
        console.error("registration 핸들러 에러:", err);
        response.writeHead(500, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end("서버 오류가 발생했습니다.");
      }
    }
  },
};
