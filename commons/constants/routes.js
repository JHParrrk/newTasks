// commons/constants/routes.js

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
} = require("../../handlers/concertHandler.js");
const { serveStatic } = require("../../handlers/staticHandler.js");
const { login, registration } = require("../../handlers/authHandler.js");
const { myOrders } = require("../../handlers/myOrdersHandler.js");

// 페이지 디렉토리 경로
const pagesDir = path.join(process.cwd(), "pages");

// 고정 라우트 목록
const routes = [
  {
    url: "/static",
    handler: (response, pathname) => serveStatic(response, pathname),
    view: null,
    type: "static",
  },
  {
    url: "/",
    handler: (response, view) => main(response, view),
    view: path.join(pagesDir, "index.html"),
  },
  {
    url: "/tennis",
    handler: (response, view) => tennisMain(response, view),
    view: path.join(pagesDir, "tennisMarket", "index.html"),
  },
  // ⭐ 핵심: tennis/order 라우트를 동적 라우트에서 고정 라우트로 이동
  // 쿼리 스트링 기반으로 동작하므로, 정규식이 아닌 정확한 URL을 사용합니다.
  {
    url: "/tennis/order",
    handler: (response, productId) => tennisOrder(response, productId),
    view: null,
    params: ["productId"], // router.js에서 이 키를 사용해 쿼리 스트링 값을 추출합니다.
  },
  {
    url: "/tennis/orderlist",
    handler: (response, view) => tennisOrderlist(response, view),
    view: path.join(pagesDir, "tennisMarket", "orderList", "index.html"),
  },
  {
    url: "/books",
    handler: (response, view) => booksMain(response, view),
    view: path.join(pagesDir, "booksMarket", "index.html"),
  },
  {
    url: "/concerts",
    handler: (response, view) => concertReservationMain(response, view),
    view: path.join(pagesDir, "concertReservation", "index.html"),
  },
  {
    url: "/login",
    handler: (response, view) => login(response, view),
    view: path.join(pagesDir, "auth", "login.html"),
  },
  {
    url: "/registration",
    handler: (response, email, password, name, view, method) =>
      registration(response, email, password, name, view, method),
    view: path.join(pagesDir, "auth", "registration.html"),
    params: ["email", "password", "name"],
  },
  {
    url: "/myOrders",
    handler: (response, view) => myOrders(response, view),
    view: path.join(pagesDir, "myOrders", "index.html"),
  },
];

// 동적 라우트 목록 (정규식)
const dynamicRoutes = [
  {
    pattern: /^\/performance\/(\d+)$/,
    handler: (response, performanceId, view) =>
      performanceDetail(response, performanceId, view),
    view: path.join(pagesDir, "concertReservation", "detail", "index.html"),
    params: ["performanceId"],
  },
];

module.exports = {
  routes,
  dynamicRoutes,
};
