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

let urls = [];
let index = 0;
let urlIndex = 0;
let aaaa = 0;
let toIndex = 0;
let arr = [];
let page = 100;
let toArr = [];

for (let i = 1; i <= page; i++) {
  let tmp = `https://etherscan.io/token/generic-tokentxns2?contractAddress=0xa4d17ab1ee0efdd23edc2869e7ba96b89eecf9ab&mode=&p=${i}`;
  urls.push(tmp);
}

var sdsd = []
var nullUrls = []
var flag = false;
getUrls(urls, lll = 5)
function getUrls(urls) {
  console.log('欧克欧克');
  // console.log(nullUrls, nullUrls.length, 'nullUrls');
  async.mapLimit(urls, lll, (url, callback) => {
    // getToValue(to, callback, newTo.length)
    superagent.get(url).end(function (err, res) {
      console.log(++toIndex);
      let $ = cheerio.load(res.text);
      let trs = $('#maindiv .table tr');
      if (trs.length !== 0) {
        if(nullUrls.includes(url)) {
          var index = nullUrls.indexOf(url);
          nullUrls.splice(index, 1);
        }
        callback(null, trs)
      } else {
        if(!nullUrls.includes(url)) {
          nullUrls.push(url)
        }
        callback(null, {})
      }
    })
  }, (err, result) => {
    sdsd.push(...result)
    console.log(nullUrls.length);
    console.log('以result');
    
    flag = true
    // console.log(sdsd.length, 'sdsd.length');
    // console.log(result.length, 'result.length');
    // if(nullUrls.length !== 0) {
    //   setTimeout(() => {
    //     getUrls(nullUrls)
    //   }, 1000);
    // } else {
    //   console.log('成功了', sdsd.length);
    // }
  })
}


var s = setInterval(function () { 
  console.log('检查flag', flag);
  if(nullUrls.length === 0) {
    clearInterval(s);
  }
  if(flag) {
    flag = false
    getUrls(nullUrls)
  }
}, 1000)