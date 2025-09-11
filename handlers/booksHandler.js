module.exports = {
  booksMain: async function (response, BooksMarketMain_view) {
    console.log("BooksMain");

    response.writeHead(200, { "Content-Type": "text/html" });
    response.write(BooksMarketMain_view);
    response.end();
  },
};
