// const getCookie = key =>{
//   const re = new RegExp("(?:(?:^|.*;\\s*)" +key +"\\s*\\=\\s*([^;]*).*$)|^.*$");
//   console.log(document.cookie)
//   return document.cookie.replace(
//     re,
//     "$1"
//   );
// }

// from https://plainjs.com/javascript/utilities/set-cookie-get-cookie-and-delete-cookie-5/
//
function getCookie(name) {
  var v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : null;
}

function setCookie(name, value, days) {
  var d = new Date();
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
  document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
}

function deleteCookie(name) {
  setCookie(name, "", -1);
}

export { getCookie, setCookie, deleteCookie };
