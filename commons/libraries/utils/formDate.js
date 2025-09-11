// formDate.js

// 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환하는 함수
function formatDate(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

module.exports = { formatDate };
