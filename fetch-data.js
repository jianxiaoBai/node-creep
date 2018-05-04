const cheerio = require('cheerio');
const xlsx = require('node-xlsx').default;
const superagent = require('superagent');
const eventproxy = require('eventproxy');
const fs = require('fs');
const async = require('async');
const express = require('express');
const static = require('express-static');
const ep = new eventproxy();
const Decimal = require('decimal.js');

let flag = false;



init()
setInterval(function () {
  // 每隔一段时间检查 flag 是否为 true
  console.log(`检查flag: => ${flag}`);
  if (flag) {
    console.log(`6秒后开始再次爬虫`, new Date());
    // 如果为true的话 10分钟后执行
    setTimeout(() => {
      flag = false;
      init()
    }, 6000 * 60);
  }
}, 6000 * 30)


function init() {
  console.time('花销的时间');
  console.log('当前时间：' + new Date());

  let urls = [];
  let index = 0;
  let urlIndex = 0;
  let toIndex = 0;
  let arr = [];
  let page = 30;
  let toArr = [];

  superagent.get('https://etherscan.io/token/generic-tokentxns2?contractAddress=0xa4d17ab1ee0efdd23edc2869e7ba96b89eecf9ab&mode=').end(function (err, res) {
    let $ = cheerio.load(res.text);
    page = $('#PagingPanel span').children('b').eq(1).text();
    console.log(`总共${page}页数据`);

    for (let i = 1; i <= page; i++) {
      let tmp = `https://etherscan.io/token/generic-tokentxns2?contractAddress=0xa4d17ab1ee0efdd23edc2869e7ba96b89eecf9ab&mode=&p=${i}`;
      urls.push(tmp);
    }

    let fetchUrl = function (url, callback) {
      superagent.get(url).end(function (err, res) {
        let $ = cheerio.load(res.text);
        let trs = $('#maindiv .table tr');
        trs.each(function (key, text) {
          if ($(text).children().eq(0).text() !== 'TxHash') {
            toArr.push($(text).children().eq(4).text());
            // arr.push({
            //   // 'index'   : ++index,
            //   'TxHash'  : $(text).children().eq(0).text(),
            //  // 'Age'  : $(text).children().eq(1).children('span').attr('title'),
            //   'Age'     : $(text).children().eq(1).text(),
            //   'From'    : $(text).children().eq(2).text(),
            //   'To'      : $(text).children().eq(4).text(),
            //   'Quantity': $(text).children().eq(5).text()
            // });
          }
        })
        console.log(`目前一抓取${++urlIndex}页，占 ${Math.ceil(urlIndex / page * 100)}%`);
        callback(null, arr)
      });
    };

    async.mapLimit(urls, 1, function (url, callback) {
      fetchUrl(url, callback);
    }, function (err, result) {
      let newTo = [...new Set(toArr)];
      // console.log(result.length, 'result.length');
      console.log(`需请求${newTo.length}, 总请求为${toArr.length}`);
      getToAddress(newTo)
    });

    function getToAddress(newTo) {
      async.mapLimit(newTo, 2, (to, callback) => {
        getToValue(to, callback, newTo.length)
      }, (err, result) => {
        console.log('请求完毕，开始写入数据');
        const data = [
          ['数量', '地址'], ...result
        ];
        let buffer = xlsx.build([{
          name: "mySheetName",
          data: data
        }]); // Returns a buffer
        fs.writeFile('./user.xlsx', buffer, {}, function () {
          flag = true
          console.log('xlsx文件写入完成');
          console.timeEnd('花销的时间');
        })

        // 创建一个可以写入的流，写入到文件 output.txt 中
        let writerStream = fs.createWriteStream('to-value.json');

        // 使用 utf8 编码写入数据
        writerStream.write(JSON.stringify(result), 'UTF8');

        // 标记文件末尾
        writerStream.end();

        // 处理流事件 --> data, end, and error
        writerStream.on('finish', function () {
          console.log("json 文件写入完成");
        });

        writerStream.on('error', function (err) {
          console.log(err.stack);
        });
      })
    }

    function getToValue(to, callback, sumLength) {
      superagent.get(`https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xa4d17ab1ee0efdd23edc2869e7ba96b89eecf9ab&address=${to}&tag=latest&apikey=YourApiKeyToken`)
        .end((err, res) => {
          if (!res) return
          console.log(`请求了${++toIndex}次, 占${Math.ceil(toIndex / sumLength * 100)}%`);
          let num = res.body.result;
          callback(null, [
            scientificToNumber(num / 1000000000000000000),
            to
          ])
        })
    }
  });
}


/*科学计数法转换数值*/
function scientificToNumber(num) {
  let str = num.toString();
  let reg = /^(\d+)(e)([\-]?\d+)$/;
  let arr, len,
    zero = '';

  /*6e7或6e+7 都会自动转换数值*/
  if (!reg.test(str)) {
    return String(num);
  } else {
    /*6e-7 需要手动转换*/
    arr = reg.exec(str);
    len = Math.abs(arr[3]) - 1;
    for (let i = 0; i < len; i++) {
      zero += '0';
    }
    return '0.' + zero + arr[1];
  }
}