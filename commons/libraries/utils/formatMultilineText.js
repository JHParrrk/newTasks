// 여러 줄 텍스트를 HTML에서 보기 좋게 변환하는 함수
function formatMultilineText(text) {
  // 1. 줄바꿈을 <br>로 변환
  let html = text.replace(/\r\n|\n|\r/g, "<br>");
  // 2. 연속 공백을 &nbsp;로 변환 (옵션)
  html = html.replace(/ {2,}/g, function (spaces) {
    return "&nbsp;".repeat(spaces.length);
  });
  return html;
}

module.exports = { formatMultilineText };
