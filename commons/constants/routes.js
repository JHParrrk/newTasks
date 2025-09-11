const path = require("path");

// 핸들러 함수 불러오기
const { booksMain } = require("../../handlers/booksHandler.js");
const { main } = require("../../handlers/mainhandler.js");
const {
  tennisMain,
  tennisOrder,
  tennisOrderlist,
} = require("../../handlers/tennisHandler.js");
const {
  concertReservationMain,
  performanceDetail,
  reservePerformance,
} = require("../../handlers/concertHandler.js");
const { serveStatic } = require("../../handlers/staticHandler.js");
const {
  login,
  logout,
  registration,
} = require("../../handlers/authHandler.js");
const { myOrders } = require("../../handlers/myOrdersHandler.js");

// 페이지 디렉토리 경로
const pagesDir = path.join(process.cwd(), "pages");

// 고정 라우트 목록
const routes = [
  {
    url: "/static",
    handler: serveStatic, // ⭐ 수정: 직접 연결
    view: null,
    type: "static",
  },
  {
    url: "/",
    handler: main, // ⭐ 수정: 직접 연결
    view: path.join(pagesDir, "index.html"),
  },
  {
    url: "/tennis",
    handler: tennisMain, // ⭐ 수정: 직접 연결
    view: path.join(pagesDir, "tennisMarket", "index.html"),
  },
  {
    url: "/tennis/order",
    handler: tennisOrder, // ⭐ 수정: 직접 연결
    view: null,
    params: ["productId"],
  },
  {
    url: "/tennis/orderlist",
    handler: tennisOrderlist, // ⭐ 수정: 직접 연결
    view: path.join(pagesDir, "tennisMarket", "orderList", "index.html"),
  },
  {
    url: "/books",
    handler: booksMain, // ⭐ 수정: 직접 연결
    view: path.join(pagesDir, "booksMarket", "index.html"),
  },
  {
    url: "/concerts",
    handler: concertReservationMain, // ⭐ 수정: 직접 연결
    view: path.join(pagesDir, "concertReservation", "index.html"),
  },
  {
    url: "/login",
    handler: login, // ⭐ 핵심 수정: login 핸들러를 직접 연결합니다.
    view: path.join(pagesDir, "auth", "login.html"),
    params: ["email", "password"],
  },
  {
    url: "/registration",
    handler: registration, // ⭐ 수정: 직접 연결
    view: path.join(pagesDir, "auth", "registration.html"),
    params: ["email", "password", "name"],
  },
  {
    url: "/myOrders",
    handler: myOrders, // ⭐ 수정: 직접 연결
    view: path.join(pagesDir, "myOrders", "index.html"),
  },
  {
    url: "/logout",
    handler: logout, // ⭐ 수정: 직접 연결
    view: null,
  },
  {
    url: "/reserve",
    handler: reservePerformance, // 아래에서 구현할 함수
    view: null, // 성공 시 별도의 뷰가 필요하다면 지정
    params: ["performance_id", "price", "quantity"],
  },
];

// 동적 라우트 목록 (정규식)
const dynamicRoutes = [
  {
    pattern: /^\/performance\/(\d+)$/,
    handler: performanceDetail, // ⭐ 수정: 직접 연결
    view: path.join(pagesDir, "concertReservation", "detail", "index.html"),
    params: ["performanceId"],
  },
];

module.exports = {
  routes,
  dynamicRoutes,
};
