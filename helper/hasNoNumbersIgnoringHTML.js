function hasNoNumbersIgnoringHTML(str) {
 console.log(str);
 
  try {
    const strippedStr = str.replace(/<[^>]*>/g, "").trim();
    // بدل التحقق من الأرقام فقط، نتحقق إن كان يحتوي على حروف أو رموز
    return /[^\d\s]/.test(strippedStr); 
  } catch (error) {
    return false;
  }
}
export { hasNoNumbersIgnoringHTML };
