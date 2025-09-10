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
let tennisMain_view;
let tennisOrderlist_view;
let BooksMarketMain_view;
let concertReservationMain_view;

function formatDate(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

async function loadViews() {
  try {
    main_view = await fs.readFile(path.join(__dirname, "index.html"), "utf-8");
    tennisMain_view = await fs.readFile(
      path.join(__dirname, "tennisMarket", "index.html"),
      "utf-8"
    );
    tennisOrderlist_view = await fs.readFile(
      path.join(__dirname, "tennisMarket", "orderlist.html"),
      "utf-8"
    );
    BooksMarketMain_view = await fs.readFile(
      path.join(__dirname, "booksMarket", "index.html"),
      "utf-8"
    );
    concertReservationMain_view = await fs.readFile(
      path.join(__dirname, "concertReservation", "index.html"),
      "utf-8"
    );
    console.log("✅ HTML 템플릿 파일 로딩 완료!");
  } catch (err) {
    console.error("🔥 HTML 파일 로딩 실패!", err);
    process.exit(1);
  }
}
loadViews(); // 서버 시작과 함께 파일 로딩 실행

// --- 각 경로별 담당자(핸들러) 함수들 ---

async function main(response) {
  console.log("main");

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
}

// 서버 사이드 렌더링 방식
async function tennisMain(response) {
  console.log("tennisMain 핸들러: 서버 사이드 렌더링 시작");
  try {
    // 1. DB에서 상품 목록을 가져온다.
    const [products] = await dbPool.query("SELECT * FROM tennis_products");
    console.log("DB 상품 목록:", products);

    // 2. ⭐️ 가져온 상품 목록(products 배열)으로 HTML 카드 문자열을 동적으로 생성합니다.
    const productCardsHtml = products
      .map(
        (product) => `
      <div class="card">
        <img class="card_img" src="${product.image_path}" />
        <p class="card_title">${product.name}</p>
        <input
          class="card_button"
          type="button"
          value="order"
          onclick="location.href='/tennis/order?productId=${product.id}'"
        />
      </div>
    `
      )
      .join(""); // .map()으로 만들어진 배열을 하나의 긴 문자열로 합칩니다.

    // 3. 템플릿(tennisMain_view)의 <!-- PRODUCT_CARDS --> 부분을
    //    방금 만든 HTML 카드 문자열(productCardsHtml)로 교체합니다.
    const finalHtml = tennisMain_view.replace(
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

async function booksMain(response) {
  console.log("BooksMain");

  response.writeHead(200, { "Content-Type": "text/html" });
  response.write(BooksMarketMain_view);
  response.end();
}

async function concertReservationMain(response) {
  console.log("concertReservationMain 요청 수신");

  if (!concertReservationMain_view) {
    console.error("🔥 concertReservationMain_view가 로드되지 않았습니다!");
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("서버 오류: 뷰 템플릿을 로드할 수 없습니다.");
    return;
  }

  try {
    // 1. DB에서 모든 공연 목록을 가져옵니다.
    const [performances] = await dbPool.query(
      "SELECT id, title, performance_date, price, image_path FROM performances ORDER BY performance_date ASC"
    );
    console.log("DB에서 가져온 공연 목록:", performances);

    // 2. 가져온 공연 목록으로 HTML 카드 문자열을 동적으로 생성합니다.
    const performanceCardsHtml = performances
      .map(
        (performance) => `
            <article class="performance-card">
              <a href="/performance/${performance.id}" class="card-link">
                <div class="card-image-wrapper">
                  <img src="${
                    performance.image_path ||
                    "https://via.placeholder.com/400x500.png?text=No+Image"
                  }" alt="${performance.title} 포스터" />
                </div>
                <div class="card-content">
                  <p class="performance-date">${formatDate(
                    new Date(performance.performance_date)
                  )}</p>
                  <h3 class="performance-title">${performance.title}</h3>
                  <p class="performance-price">${performance.price.toLocaleString(
                    "ko-KR"
                  )}원</p>
                </div>
              </a>
            </article>
        `
      )
      .join("");

    // 3. 템플릿의 플레이스홀더를 생성된 HTML로 교체합니다.
    const finalHtml = concertReservationMain_view.replace(
      "<!--PERFORMANCE_CARDS-->",
      performanceCardsHtml
    );

    // 4. 완성된 HTML을 클라이언트에 전송합니다.
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.write(finalHtml);
    response.end();
  } catch (err) {
    console.error("concertReservationMain 핸들러 에러:", err);
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("서버 오류가 발생했습니다.");
  }
}

// ⭐️ 모든 정적 파일(이미지, CSS 등)을 처리할 범용 핸들러
async function serveStatic(response, pathname) {
  // __dirname: 현재 파일(requestHandler.js)이 있는 디렉토리 경로
  // public: 정적 파일이 모여있는 폴더
  // pathname: 브라우저가 요청한 경로 (예: /styles/tennisMarket.css)
  const safePath = path.join(__dirname, "public", pathname.substring(1));

  // 보안: 요청 경로가 public 폴더를 벗어나지 못하게 방지
  if (!safePath.startsWith(path.join(__dirname, "public"))) {
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
}

// ✨ 가장 중요! SQL Injection을 방어하는 방식으로 변경
async function tennisOrder(response, productId) {
  try {
    // ⭐️ new Date().toLocaleDateString()는 '2025. 9. 10.' 처럼 OS/지역별로 다른 형식의 문자열을 만듭니다.
    // DB의 DATE 타입과 형식이 맞지 않아 오류가 날 수 있으므로, 'YYYY-MM-DD' 형식으로 바꿔주는 것이 안전합니다.
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1, 두 자리로 맞춤
    const day = String(today.getDate()).padStart(2, "0"); // 두 자리로 맞춤
    const formattedDate = `${year}-${month}-${day}`;

    const sql =
      "INSERT INTO tennis_orders (product_id, order_date) VALUES (?, ?)";
    const params = [productId, formattedDate]; // 안전하게 포맷된 날짜 사용

    // 쿼리 실행
    const [result] = await dbPool.query(sql, params);
    console.log("주문 결과:", result);

    // --- ⭐️ 이 부분이 핵심 변경 사항입니다 ---
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.write(`
      <script>
        alert("주문이 완료되었습니다!\\n주문 목록 페이지에서 확인하실 수 있습니다.");
        window.location.href = "/tennis"; // alert 창을 닫으면 메인 페이지로 이동합니다.
      </script>
    `);
    response.end();
    // ------------------------------------
  } catch (err) {
    console.error("order 핸들러 에러:", err);
    response.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    response.write(`
      <script>
        alert("주문 처리 중 오류가 발생했습니다.\\n다시 시도해 주세요.");
        window.history.back(); // 오류 발생 시 이전 페이지로 돌아갑니다.
      </script>
    `);
    response.end();
  }
}

// HTML 생성을 더 효율적인 방식으로 변경
async function tennisOrderlist(response) {
  console.log("tennisOrderlist");
  try {
    const [rows] = await dbPool.query("SELECT * FROM tennis_orders");

    // 1. HTML 조각들을 먼저 만듭니다.
    const tableRows = rows
      .map((element) => {
        // DB에서 가져온 날짜 데이터(element.order_date)로 Date 객체를 만듭니다.
        const orderDate = new Date(element.order_date);

        // 'YYYY-MM-DD' 형식으로 직접 포맷팅합니다.
        const year = orderDate.getFullYear();
        const month = String(orderDate.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1
        const day = String(orderDate.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        // 포맷팅된 날짜(formattedDate)를 HTML에 사용합니다.
        return `
          <tr>
            <td>${element.product_id}</td>
            <td>${formattedDate}</td>
          </tr>
        `;
        // --- ⭐️ 수정 끝 ---
      })
      .join("");

    // 2. 완성된 HTML을 응답으로 보냅니다.
    const finalHtml = tennisOrderlist_view.replace(
      "<!-- DATA_ROWS -->",
      tableRows
    );

    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.write(finalHtml);
    response.end();
  } catch (err) {
    console.error("tennisOrderlist핸들러 에러:", err);
    response.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    response.write("주문 목록을 불러오는 중 오류가 발생했습니다.");
    response.end();
  }
}
// 팁: orderlist.html 파일의 <table> 안에 <tbody></tbody>를 만들고, 그 사이에 <!-- DATA_ROWS --> 주석을 넣어두세요.

// --- 핸들러 목록 ---
let handle = {};
handle["/"] = main;
handle["/tennis"] = tennisMain;
handle["/tennis/order"] = tennisOrder;
handle["/tennis/orderlist"] = tennisOrderlist;
handle["/static"] = serveStatic; // 범용 핸들러 등록
handle["/books"] = booksMain;
handle["/concerts"] = concertReservationMain;

exports.handle = handle;
