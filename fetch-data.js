const cheerio    = require('cheerio');
const xlsx       = require('node-xlsx').default;
const superagent = require('superagent');
const eventproxy = require('eventproxy');
const fs         = require('fs');
const async      = require('async');
const express    = require('express');
const static     = require('express-static');
const ep         = new eventproxy();

var flag         = false;

init()
// setInterval(function() {
//   // 每隔一段时间检查 flag 是否为 true
//   console.log(`检查flag: => ${flag}`);
//     if (flag) {
//       console.log(`6秒后开始再次爬虫`, new Date());
//       // 如果为true的话 10分钟后执行
//       setTimeout(() => {
//         flag = false;
//         init()
//       }, 6000 * 60);
//     }
//   }, 100000)

function init() {
  console.time('花销的时间');
  console.log('当前时间：' + new Date());

  var urls     = [];
  var index    = 0;
  var urlIndex = 0;
  var toIndex  = 0;
  var arr      = [];
  var page     = 2;
  var toArr    = [];

  superagent.get('https://etherscan.io/token/generic-tokentxns2?contractAddress=0xa4d17ab1ee0efdd23edc2869e7ba96b89eecf9ab&mode=').end(function (err, res) {
    var $ = cheerio.load(res.text);
    // page = $('#PagingPanel span').children('b').eq(1).text()
    console.log(`总共${page}页数据`);

    for (var i = 1; i <= page; i++) {
      var tmp = `https://etherscan.io/token/generic-tokentxns2?contractAddress=0xa4d17ab1ee0efdd23edc2869e7ba96b89eecf9ab&mode=&p=${i}`;
      urls.push(tmp);
    }

    var fetchUrl = function (url, callback) {
      superagent.get(url).end(function (err, res) {
        var $ = cheerio.load(res.text);
        var trs = $('#maindiv .table tr');
        trs.each(function (key, text) {
          if ($(text).children().eq(0).text() !== 'TxHash') {
            toArr.push($(text).children().eq(4).text());
            // arr.push({
            //   'index'   : ++index,
            //   'TxHash'  : $(text).children().eq(0).text(),
            //  // 'Age'  : $(text).children().eq(1).children('span').attr('title'),
            //   'Age'     : $(text).children().eq(1).text(),
            //   'From'    : $(text).children().eq(2).text(),
            //   'To'      : $(text).children().eq(4).text(),
            //   'Quantity': $(text).children().eq(5).text()
            // });
          }
        })
        console.log(`目前一抓取${++urlIndex}页`);
        callback(null, arr)
      });
    };

    async.mapLimit(urls, 10, function (url, callback) {
      fetchUrl(url, callback);
    }, function (err, result) {
      var newTo = [...new Set(toArr)];
      console.log(`需请求${newTo.length}`);
      getToAddress(newTo)
    });

    function getToAddress(newTo) {
      async.mapLimit(newTo, 20, (to, callback) => {
        getToValue(to, callback)
      }, (err, result) => {
        console.log('请求完毕，开始写入数据');
        const data = [
          ['数量', '地址'], ...result
        ];
        var buffer = xlsx.build([{
          name: "mySheetName",
          data: data
        }]); // Returns a buffer
        fs.writeFile('./user.xlsx', buffer, {}, function () {
          console.log('写入完毕');
          console.timeEnd('花销的时间');
        })
      })
    }


    function getToValue(to, callback) {
      superagent.get(`https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xa4d17ab1ee0efdd23edc2869e7ba96b89eecf9ab&address=${to}&tag=latest&apikey=YourApiKeyToken`)
        .end((err, res) => {
          console.log(`请求了${++toIndex}次`);
          var n = String(res.body.result)
          callback(null, [
            n.substr(0, n.length - 18),
            to
          ])
        })
    }
  });
}