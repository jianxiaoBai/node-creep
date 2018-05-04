var fs = require('fs');
var express = require('express');
var static  = require('express-static');
var server = express()

server.use('/qqq', (req, res) => {
  var data = '';
  var index = 0 ;
  var readerStream = fs.createReadStream('./toValue.json');
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
