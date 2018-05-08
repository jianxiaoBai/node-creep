var fs = require("fs");

// 同步读取
var data = fs.readFileSync('sign.js');
console.log(data.toString());
// console.log("同步读取: " + data.toString());

// console.log("程序执行完毕。");
// // 异步读取
// fs.readFile('test.txt', function (err, data) {
//    if (err) {
//        return console.error(err);
//    }
//    console.log("异步读取: " + data.toString());
// });
