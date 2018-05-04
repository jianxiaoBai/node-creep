const cheerio     = require('cheerio');
const superagent  = require('superagent');
const eventproxy  = require('eventproxy');
const fs          = require('fs');
const async       = require('async');
const express     = require('express');
var static        = require('express-static');
var ep            = new eventproxy();
var flag = false;

init()
/*  */
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
  console.log(new Date());
  var urls          = [];
  var index         = 0;
  var urlIndex         = 0;
  var toIndex       = 0;
  var arr           = [];
  var page          = 2;
  var toArr         = [];
  var getToValueArr = [];

  superagent.get('https://etherscan.io/token/generic-tokentxns2?contractAddress=0xa4d17ab1ee0efdd23edc2869e7ba96b89eecf9ab&mode=').end(function (err, res) {
    var $ = cheerio.load(res.text);
    page = $('#PagingPanel span').children('b').eq(1).text()
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
            arr.push({
              'index'   : ++index,
              'TxHash'  : $(text).children().eq(0).text(),
              // 'Age'  : $(text).children().eq(1).children('span').attr('title'),
              'Age'     : $(text).children().eq(1).text(),
              'From'    : $(text).children().eq(2).text(),
              'To'      : $(text).children().eq(4).text(),
              'Quantity': $(text).children().eq(5).text()
            });
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
      // var newToValue = []
      // fs.writeFile('./base.json', JSON.stringify(result))
      // console.log(`总共有${toArr.length}条address，有${toArr.length - newTo.length}重复`);
      console.log(`需请求${newTo.length}`);
      getToAddress(newTo)
    });

    function getToAddress(newTo) {
      async.mapLimit(newTo, 10, (to, callback) => {
        getToValue(to, callback)
      }, (err, result) => {

        // 创建一个可以写入的流，写入到文件 output.txt 中
        var writerStream = fs.createWriteStream('toValue.json', {
          'flags': 'w'
        });

        // 使用 utf8 编码写入数据
        writerStream.write(JSON.stringify(result),'UTF8');

        // 标记文件末尾
        writerStream.end();

        // 处理流事件 --> data, end, and error
        writerStream.on('finish', function() {
          flag = true;
          console.log('数据已写入');
          console.timeEnd('一趟流程所花销的时间');
        });

        writerStream.on('error', function(err){
          console.log(err.stack);
        });
      })
    }


    function getToValue (to, callback) {
      superagent.get(`https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xa4d17ab1ee0efdd23edc2869e7ba96b89eecf9ab&address=${to}&tag=latest&apikey=YourApiKeyToken`)
        .end((err, res) => {
          console.log(`请求了${++toIndex}次`);
          // console.log(res.body.result);
          callback(null, {
            key: res.body.result / 1.0e18,
            to: to
          })
        })
    }
    // var sssss = setInterval(function () {
    //   console.log(`目前一抓取${arr.length}, 总共 ${ page * 25 } , 占百分比 ${Math.ceil(arr.length / (page * 25) * 100)} %`);
    // }, 500)
  });
}