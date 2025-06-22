// 測試沒有 module.exports 的模組
const testModule = require('./testModule');

console.log('載入的模組內容:', testModule);
console.log('testFunction 是否存在:', typeof testModule.testFunction);

// 嘗試呼叫函數
try {
    console.log(testModule.testFunction());
} catch (error) {
    console.log('錯誤:', error.message);
}
