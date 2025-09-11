const dbPool = require("../database/connect/mariadb"); // db

module.exports = {
  main: async function (response, main_view) {
    console.log("main 핸들러: 서버 사이드 렌더링 시작");

    if (!main_view) {
      console.error("main_view 로드되지 않았습니다!");
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류: 뷰 템플릿을 로드할 수 없습니다.");
      return;
    }

    try {
      const [projects] = await dbPool.query("SELECT * FROM projects");
      console.log("projects 목록:", projects);

      // 2. ⭐️ 가져온 프로젝트 목록(projects 배열)으로 HTML 카드 문자열을 동적으로 생성합니다.
      const projectCardsHtml = projects
        .map(
          (project) => `
      <div class="card">
        <img class="card_img" src="${project.image_path}" />
        <p class="card_title">${project.title}</p>
        <input
          class="card_button"
          type="button"
          value="자세히 보러가기"
          onclick="location.href='${project.project_url}'"
        />
      </div>
    `
        )
        .join(""); // .map()으로 만들어진 배열을 하나의 긴 문자열로 합칩니다.

      // 3. 템플릿(main_view)의 <!-- PRODUCT_CARDS --> 부분을
      //    방금 만든 HTML 카드 문자열(projectCardsHtml)로 교체합니다.
      const finalHtml = main_view.replace(
        "<!-- PRODUCT_CARDS -->",
        projectCardsHtml
      );

      // 4. 완성된 최종 HTML을 클라이언트에게 보냅니다.
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(finalHtml);
      response.end();
    } catch (err) {
      console.error("main 핸들러 에러:", err);
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.end("서버 오류가 발생했습니다.");
    }
  },
};
