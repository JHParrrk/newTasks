const dbPool = require("../database/connect/mariadb"); // db
const { formatDate } = require("../commons/libraries/utils/formDate.js");

module.exports = {
  login: async function (
    response,
    email,
    password,
    login_view,
    cookies,
    method = "GET"
  ) {
    console.log(`login 핸들러: ${method} 요청`);

    // 1. GET 요청: 로그인 페이지만 보여줌
    if (method === "GET") {
      if (!login_view) {
        response.writeHead(500, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end("서버 오류: 로그인 템플릿을 로드할 수 없습니다.");
        return;
      }
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(login_view);
      response.end();
      return;
    }

    // 2. POST 요청: 로그인 처리
    if (method === "POST") {
      try {
        // DB에서 사용자 정보 확인
        const sql =
          "SELECT id, email, name FROM users WHERE email = ? AND password = ?";
        const [rows] = await dbPool.query(sql, [email, password]);

        if (rows.length > 0) {
          // --- 로그인 성공 ---
          const user = rows[0];
          console.log("로그인 성공:", user);

          // 쿠키에 담을 사용자 정보 (객체)
          const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
          };

          // 객체를 JSON 문자열로 변환 후, Base64로 인코딩 (URL-safe 문자열로 만들기 위함)
          const cookieValue = Buffer.from(JSON.stringify(userData)).toString(
            "base64"
          );

          // 쿠키 설정과 함께 헤더 작성
          response.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Set-Cookie": `user=${cookieValue}; Path=/; HttpOnly`, // HttpOnly: JS에서 쿠키 접근 방지
          });

          // 성공 알림 후 메인 페이지로 이동하는 스크립트 응답
          response.end(`
            <script>
              alert("${user.name}님, 환영합니다!");
              window.location.href = "/concerts";
            </script>
          `);
        } else {
          // --- 로그인 실패 ---
          console.log("로그인 실패: 일치하는 사용자가 없습니다.");
          response.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
          });
          response.end(`
            <script>
              alert("이메일 또는 비밀번호가 일치하지 않습니다.");
              window.history.back(); // 이전 페이지(로그인 페이지)로 돌아가기
            </script>
          `);
        }
      } catch (err) {
        console.error("login 핸들러 DB 에러:", err);
        response.writeHead(500, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end("서버 오류가 발생했습니다.");
      }
    }
  },
  registration: async function (
    response,
    email,
    password,
    name,
    registration_view,
    cookies,
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
  logout: function (response) {
    // user 쿠키 삭제 (Expires in the past or Max-Age=0)
    response.writeHead(302, {
      "Set-Cookie": "user=; Max-Age=0; Path=/; HttpOnly",
      Location: "/concerts", // 로그아웃 후 리다이렉트 경로
    });
    response.end();
  },
};
