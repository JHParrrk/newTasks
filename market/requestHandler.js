// requestHandler.js
// (실제 작업자): 각 경로(pathname)별로 실제 작업 내용을 수행하는 담당자(핸들러)들이 모여 있는 곳입니다.

// requestHandler.js (개선된 버전)

// 1. 파일 시스템 모듈을 promise 기반으로 불러옵니다.
const fs = require("fs").promises;
const path = require("path");
// 2. 우리가 만든 DB 연결 풀(Pool) 부품을 불러옵니다.
const dbPool = require("./database/connect/mariadb"); // db.js 파일

// HTML 파일을 미리 읽어와서 변수에 저장해 둡니다. (서버 시작 시 한 번만)
let main_view;
let orderlist_view;

async function loadViews() {
  try {
    main_view = await fs.readFile("./main.html", "utf-8");
    orderlist_view = await fs.readFile("./orderlist.html", "utf-8");
    console.log("✅ HTML 템플릿 파일 로딩 완료!");
  } catch (err) {
    console.error("🔥 HTML 파일 로딩 실패!", err);
    process.exit(1);
  }
}
loadViews(); // 서버 시작과 함께 파일 로딩 실행

// --- 각 경로별 담당자(핸들러) 함수들 ---

// 서버 사이드 렌더링 방식
async function main(response) {
  console.log("main 핸들러: 서버 사이드 렌더링 시작");
  try {
    // 1. DB에서 상품 목록을 가져온다.
    const [products] = await dbPool.query("SELECT * FROM product");
    console.log("DB 상품 목록:", products);

    // 2. ⭐️ 가져온 상품 목록(products 배열)으로 HTML 카드 문자열을 동적으로 생성합니다.
    const productCardsHtml = products
      .map(
        (product) => `
      <div class="card">
        <img class="card_img" src="${product.img_path}" />
        <p class="card_title">${product.name}</p>
        <input
          class="card_button"
          type="button"
          value="order"
          onclick="location.href='/order?productId=${product.id}'"
        />
      </div>
    `
      )
      .join(""); // .map()으로 만들어진 배열을 하나의 긴 문자열로 합칩니다.

    // 3. 템플릿(main_view)의 <!-- PRODUCT_CARDS --> 부분을
    //    방금 만든 HTML 카드 문자열(productCardsHtml)로 교체합니다.
    const finalHtml = main_view.replace(
      "<!-- PRODUCT_CARDS -->",
      productCardsHtml
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
}

// ⭐️ 모든 정적 파일(이미지, CSS 등)을 처리할 범용 핸들러 생성
async function serveStatic(response, pathname) {
  // 3. 보안: 요청된 경로가 프로젝트 외부로 나가지 못하도록 안전한 파일 경로 생성
  // 예: pathname이 '/img/redRacket.png'이면, './public/img/redRacket.png' 와 같이 만듦
  const safePath = path.join(__dirname, "public", pathname);

  // 4. 보안 강화: 생성된 경로가 실제로 'public' 폴더 내에 있는지 재확인
  if (!safePath.startsWith(path.join(__dirname, "public"))) {
    console.error(`보안 위협 감지: 상위 디렉토리 접근 시도 - ${pathname}`);
    response.writeHead(403, { "Content-Type": "text/plain" });
    response.end("Forbidden");
    return;
  }

  try {
    // 5. 파일 확장자에 따라 적절한 Content-Type 설정
    const ext = path.extname(safePath).toLowerCase();
    let contentType = "application/octet-stream"; // 기본값
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".css") contentType = "text/css";
    else if (ext === ".js") contentType = "application/javascript";

    const data = await fs.readFile(safePath);
    response.writeHead(200, { "Content-Type": contentType });
    response.write(data);
    response.end();
  } catch (err) {
    console.error(`정적 파일 핸들러 에러: ${pathname}`, err.code);
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not Found");
  }
}

// ✨ 가장 중요! SQL Injection을 방어하는 방식으로 변경
async function order(response, productId) {
  try {
    const sql = "INSERT INTO orderlist (product_id, order_date) VALUES (?, ?)";
    const params = [productId, new Date().toLocaleDateString()];

    // 쿼리 실행: ?에 params 배열의 값이 순서대로 안전하게 들어갑니다.
    const [result] = await dbPool.query(sql, params);
    console.log("주문 결과:", result);

    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.write(
      "주문이 완료되었습니다! <br> 주문 목록 페이지에서 확인하실 수 있습니다." +
        '<div><a href="/">메인으로 돌아가기</a></div>'
    );
    response.end();
  } catch (err) {
    console.error("order 핸들러 에러:", err);
    // ... 에러 처리
  }
}

// HTML 생성을 더 효율적인 방식으로 변경
async function orderlist(response) {
  console.log("orderlist");
  try {
    const [rows] = await dbPool.query("SELECT * FROM orderlist");

    // 1. HTML 조각들을 먼저 만듭니다.
    const tableRows = rows
      .map(
        (element) => `
      <tr>
        <td>${element.product_id}</td>
        <td>${element.order_date}</td>
      </tr>
    `
      )
      .join("");

    // 2. 완성된 HTML을 응답으로 보냅니다.
    // (템플릿의 특정 부분에 tableRows를 끼워넣는 방식)
    const finalHtml = orderlist_view.replace("<!-- DATA_ROWS -->", tableRows);

    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.write(finalHtml);
    response.end();
  } catch (err) {
    console.error("orderlist 핸들러 에러:", err);
    // ... 에러 처리
  }
}
// 팁: orderlist.html 파일의 <table> 안에 <tbody></tbody>를 만들고, 그 사이에 <!-- DATA_ROWS --> 주석을 넣어두세요.

// --- 핸들러 목록 ---
let handle = {};
handle["/"] = main;
handle["/order"] = order;
handle["/orderlist"] = orderlist;
handle["/static"] = serveStatic; // 범용 핸들러 등록

exports.handle = handle;
