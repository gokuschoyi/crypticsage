var fs = require('fs')
var morgan = require('morgan')
var path = require('path')

var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access_one.log'), { flags: 'a' })
morgan.token('local-time', (req, res) => {
    return new Date().toLocaleString('au');
});

module.exports = morgan(':remote-addr - :remote-user [:local-time] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', { stream: accessLogStream });