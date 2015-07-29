"use strict";
var express = require('express'),
    app = express(),
    port = 3000;

var defer = Promise.defer(),
    getChar = function* () {
        var char = 0;
        while (true) {
            yield char;
            char = char === 9 ? 0 : char + 1;
        }
    };
app
    .use('/files', express.static(__dirname + '/files'))
    .get('/chunk/:size.txt', function (req, res) {
        var count = 0,
            size = parseInt(req.params.size),
            char = getChar();
        while (count < size) {
            res.write(char.next().value.toString());
            count++;
        }
        res.send();
    }).get('/range/:size.txt', function (req, res) {
        var count = 0,
            str = '',
            size = parseInt(req.params.size),
            char = getChar();
        while (count < size) {
            str += char.next().value.toString();
            count++;
        }
        res.send(str);
    });

app.listen(port);