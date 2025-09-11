function parseCookie(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc, [key, val]) => {
      acc[key.trim()] = decodeURIComponent((val || "").trim());
      return acc;
    }, {});
}
module.exports = parseCookie;
