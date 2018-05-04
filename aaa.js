const fs = require('fs');
const express = require('express');
const static  = require('express-static');
const server = express()

server.use('/excel', (req, res) => {
  res.sendFile(`${__dirname}/user.xlsx`);
})
server.use('/toValues', (req, res) => {
  let data = '';
  let index = 0 ;
  let readerStream = fs.createReadStream('./toValue.json');
  readerStream.setEncoding('UTF8');

  readerStream.on('data', function(chunk) {
    console.log(index++);
    data += chunk;
  })

  readerStream.on('end', function () { 
    console.log('读取数据成功');
    res.send(data)
  })
})

console.log('启动成功，监听3002端口');
server.use(static('./www'));
server.listen(3002)
