const fs = require('fs');
const express = require('express');
const static = require('express-static');
const server = express();
const xlsx = require('node-xlsx').default;

server.use('/excel', (req, res) => {
  let str = '';
  let readerStream = fs.createReadStream('to-value-xx.json');
  
  readerStream.setEncoding('UTF8');

  readerStream.on('data', function (chunk) {
    str += chunk;
  })
  readerStream.on('end', function (chunk) {
    let dataArr = JSON.parse(str)
    // let dateFilter = dataArr.filter(x => x[0] != 0)
    const data = [
      ['数量', '地址'], ...dataArr
    ];
    let buffer = xlsx.build([{
      name: 'mySheetName',
      data: data
    }]); // Returns a buffer
  
    fs.writeFile('./user.xlsx', buffer, {
      'flags': 'w'
    }, function () {
      console.log('xlsx文件写入完成');
      res.sendFile(`${__dirname}/user.xlsx`);
    })
    
  })
  
})
server.use('/to-values', (req, res) => {
  let data = '';
  let index = 0;
  let update = fs.readFileSync('time.js');
  let readerStream = fs.createReadStream('to-value-xx.json');
  readerStream.setEncoding('UTF8');

  readerStream.on('data', function (chunk) {
    console.log(index++);
    data += chunk;
  })

  readerStream.on('end', function () {
    console.log('读取数据成功');
    res.send({
      body: data,
      update: update.toString()
    })
  })
})

console.log('启动成功，监听3002端口');
server.use(static('./www'));
server.listen(3002)