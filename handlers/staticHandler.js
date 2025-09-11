const fs = require("fs").promises;
const path = require("path");

module.exports = {
  // ⭐️ 모든 정적 파일(이미지, CSS 등)을 처리할 범용 핸들러
  serveStatic: async function (response, pathname) {
    // 프로젝트 루트의 C:\Users\admin\Documents\GitHub\tasks\first_project>
    // 의 public 폴더를 기준으로 경로 조합
    const publicDir = path.join(process.cwd(), "public");
    const safePath = path.join(publicDir, pathname.substring(1));

    console.log("정적 파일 요청:", safePath);

    // 보안: public 폴더를 벗어나지 못하게 방지
    if (!safePath.startsWith(publicDir)) {
      response.writeHead(403, { "Content-Type": "text/plain" });
      response.end("Forbidden");
      return;
    }

    try {
      const ext = path.extname(safePath).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".css") contentType = "text/css";
      else if (ext === ".js") contentType = "application/javascript";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";

      const data = await fs.readFile(safePath);
      response.writeHead(200, { "Content-Type": contentType });
      response.write(data);
      response.end();
    } catch (err) {
      console.error(`정적 파일 에러: ${pathname}`, err.code);
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("Not Found");
    }
  },
};
