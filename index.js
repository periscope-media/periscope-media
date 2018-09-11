const express = require('express')
const cors = require('cors')
const path = require('path')
const qs = require('qs')
const PORT = process.env.PORT || 5000

var newsDump = [
  {
    "title": "Good To Go",
    "description": "It has been a not so long up hill battle. But it is ok.",
    "published": 1536680120350,
    "found": 1536680120350,
    "author": "braun braun",
    "url": "localhost:5000/api/v2/news",
    "image": "https://picsum.photos/100/100"
  }
]

function getNewsDump () {
  return newsDump.filter(function (news, i) {
    return i < 5
  })
}

function getNews () {
  return getNewsDump().filter(function (news, i) {
    return i < 5
  })
}

function getToken () {
  console.log('getting token')
  return new Date().getTime()
}

function endpointPing (req, res) {
  console.log('ponging with pong')
  return res.format({
    'application/json': function () {
      return res.send({ pong: 'pong' })
    }
  })
}

function middlewareAuthenticated (req, res, next) {
  console.log('checking for authorization headers')
  if (req.headers.authorization) {
    console.log('found authorization headers')
    next()
  } else {
    console.log('did not find authorization headers')
    res.redirect('/api/v2/authenticate')
  }
}

function middlewareAuthorize (req, res, next) {
  console.log('authorization')
  var authorizationToken = req.headers.authorization
  try {
    console.log('verifying token')
    var authorized = new Date(authorizationToken)
    next()
  } catch (e) {
    console.log('token not valid')
    res.sendStatus(401)
    res.redrect('/api/v2/authenticate')
  }
}

function endpointAuthenticate (req, res) {
  console.log('authenticating request owner')
  var body = ''
  req.on('data', function (data) {
    console.log('got: ', body, data)
    body += data
  }).on('end', function () {
    console.log('finalized body: ', body.toString())
    try {
      var authenticationResource = JSON.parse(body.toString())
      console.log('got authenticationResource info: ', authenticationResource)
      console.log('attempting to verify data')
      if (authenticationResource.username === 'braun' && authenticationResource.password === 'braun') {
        console.log('credentials verified')
        var token = getToken()
        console.log('sending token: ', token)
        res.writeHead(200, {
          'Authorization': token
        })
        console.log('sent token')
      } else {
        console.log('invalid credentials')
        res.sendStatus(401)
      }
    } catch (e) {
      console.log('bad post data')
      res.sendStatus(422)
    }
    res.end()
  })
}

function endpointGetNews (req, res) {
  console.log('deliverying news')
  return res.format({
    'application/json': function () {
      return res.send(getNews())
    }
  })
}

function endpointGetNewsDump (req, res) {
  console.log('deliverying news')
  return res.format({
    'application/json': function () {
      return res.send(getNewsDump())
    }
  })
}

function endpointPostNews (req, res) {
  console.log('preparing news for entry')
  var body = ''
  req.on('data', function (data) {
    console.log('got: ', body, data)
    body += data
  }).on('end', function () {
    console.log('finalized body: ', body)
    try {
      var news = JSON.parse(body.toString())
      console.log('got post data: ', news)
      console.log('attempting to verify data')
      if (news.title && news.description && news.published && news.found && news.url && news.author && news.image) {
        console.log('news verified')
        console.log('adding news to dump: ', news)
        newsDump.push(news)
        res.sendStatus(200)
        console.log('news recorded')
      } else {
        console.log('invalid news')
        res.sendStatus(415)
      }
    } catch (e) {
      console.log('bad post data')
      res.sendStatus(422)
    }
    res.end()
  })
}

express()
  .use(cors())
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .post('/api/v2/authenticate', endpointAuthenticate)
  .get('/api/v2/ping', endpointPing)
  .get('/api/v2/news', endpointGetNews)
  .post('/api/v2/news', middlewareAuthenticated, middlewareAuthorize, endpointPostNews)
  .get('/api/v2/news/dump', endpointGetNewsDump)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
