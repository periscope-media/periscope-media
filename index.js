const express = require('express')
const pg = require('pg')
const cors = require('cors')
const path = require('path')
const qs = require('qs')
const PORT = process.env.PORT || 5000



// -- globals ---------------------------------------------- <
console.log('using:', process.env.DATABASE_URL)
const postgres = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true
})
var newsDump = [
  {
    "title": "Good To Go",
    "description": "It has been a not so long up hill battle. But it is ok.",
    "published": 1536680120350,
    "found": 1536680120350,
    "author": "braun braun",
    "url": "localhost:5000/api/v2/news",
    "image": "https://picsum.photos/100/104"
  }
]


// -- functions -------------------------------------------- <
function getNewsDump () {
  return newsDump.filter(function (news, i) {
    return i < 5
  })
}

function getNews () {
  const dump = getNewsDump()
  dump.reverse()
  return dump
}

function getToken () {
  console.log('getting token')
  return new Date().getTime()
}

function endpointPing (req, res) {
  console.log('ponging with pong')
  res.format({
    'application/json': function () {
      return res.send({ pong: 'pong' })
    }
  })
  res.end()
}

function middlewareAuthenticated (req, res, next) {
  console.log('checking for authorization headers')
  if (req.headers.authorization) {
    console.log('found authorization headers')
    next()
  } else {
    console.log('did not find authorization headers')
    res.redirect('/api/v2/authenticate')
    res.end()
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
    res.end()
  }
}

function endpointRegister (req, res) {
  var body = ''
  req.on('data', function (data) {
    console.log('/register got:', body, data)
    body += data
  }).on('end', function () {
    console.log('finalized body:', body.toString())
    try {
      var registrationInformation = JSON.parse(body.toString())
      console.log('got registration info:', registrationInformation)
      console.log('attempting to verify data')
      if (registrationInformation.username && registrationInformation.password) {
        postgres.query(
          'insert into users (uname, upassword, ubirthday) values ($1, $2)',
          [
            registrationInformation.username,
            registrationInformation.password
          ],
          function (err, res) {
            if (err) {
              console.log('error inserting into users:', err)
              res.sendStatus(500)
              res.end()
            } else {
              res.format({
                'application/json': function () {
                  return res.send(res.rows)
                }
              })
              res.end()
            }
          }
        )
      } else {
        console.log('invalid post data')
        res.sendStatus(415)
        res.end()
      }
    } catch (e) {
      console.log('bad post data')
      res.sendStatus(422)
      res.end()
    }
  })
}

function endpointUsers (req, res) {
  postgres.query(
    'select uname, ubirthday from users',
    function (err, results) {
      if (err) {
        console.log('error selecting from user:', err)
        res.sendStatus(500)
        res.end()
      } else {
        res.format({
          'application/json': function () {
            return res.send(results.rows)
          }
        })
        res.end()
      }
    }
  )
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
          'Access-Control-Expose-Headers': 'Authorization',
          'Authorization': token
        })
        console.log('sent token')
        res.end()
      } else {
        console.log('invalid credentials')
        res.sendStatus(401)
        res.end()
      }
    } catch (e) {
      console.log('bad post data')
      res.sendStatus(422)
      res.end()
    }
  })
}

function endpointGetNews (req, res) {
  postgres.query(
    // 'select a.nid, a.ntitle, a.ndescription, a.nauthor, a.nurl, a.nimage, a.npublished, a.nfound, b.uname from news a, users b where a.uid_ = b.uid_',
    'select * from news order by nid desc limit 5',
    function (err, results) {
      if (err) {
        console.log('error deliverying news:', err)
        res.sendStatus(500)
        res.end()
      } else {
        var news = results.rows
        var newss = news.map(function (n) {
          return Object.assign(n, {
            npublished: new Date(n.npublished).getTime(),
            nfound: new Date(n.nfound).getTime()
          })
        })
        console.log('deliverying news')
        res.format({
          'application/json': function () {
            return res.send(newss)
          }
        })
        res.end()
      }
    }
  )
}

function endpointGetNewsDump (req, res) {
  console.log('attempting to query news')
  postgres.query('select * from news order by nid desc', function(err, results) {
    if (err) {
      console.log('error selecting from news:', err)
      res.sendStatus(500)
      res.end()
    } else {
      console.log('deliverying news')
      var news = results.rows
      var newsDump = news.map(function (n) {
        return Object.assign(n, {
          npublished: new Date(n.npublished).getTime(),
          nfound: new Date(n.nfound).getTime()
        })
      })
      res.format({
        'application/json': function () {
          return res.send(newsDump)
        }
      })
      res.end()
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
      if (news.ntitle && news.ndescription && news.npublished && news.nfound && news.nurl && news.nauthor && news.nimage) {
        console.log('news verified')
        console.log('adding news to dump: ', news)
        postgres.query(
          'insert into news (ntitle, ndescription, npublished, nfound, nurl, nauthor, nimage)'+
          'values ($1, $2, to_timestamp($3), to_timestamp($4), $5, $6, $7)',
          [
            news.ntitle,
            news.ndescription,
            news.npublished/1000,
            news.nfound/1000,
            news.nurl,
            news.nauthor,
            news.nimage
          ],
          function (err, results) {
            if (err) {
              console.log('error inserting news:', err)
              res.sendStatus(500)
              res.end()
            } else {
              res.format({
                'application/json': function () {
                  return res.send(results.rows)
                }
              })
              console.log('news recorded')
              res.end()
            }
        })
      } else {
        console.log('invalid news')
        res.sendStatus(415)
        res.end()
      }
    } catch (e) {
      console.log('bad post data')
      res.sendStatus(422)
      res.end()
    }
  })
}


// -- program ---------------------------------------------- <

postgres.connect()

console.log('postgress data connected..')

express()
  .use(cors())
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/api/v2/ping', endpointPing)
  .get('/api/v2/users', endpointUsers)
  .post('/api/v2/register', endpointRegister)
  .post('/api/v2/authenticate', endpointAuthenticate)
  .get('/api/v2/news', endpointGetNews)
  .post('/api/v2/news', middlewareAuthenticated, middlewareAuthorize, endpointPostNews)
  .get('/api/v2/news/dump', endpointGetNewsDump)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
