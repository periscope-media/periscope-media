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


// -- functions -------------------------------------------- <
function endpointGetTodos (req, res) {
  postgres.query(
    'select * from todos',
    function (err, results) {
      if (err) {
        console.log('error selecting todos', err)
        res.sendStatus(500)
        res.end()
      } else {
        var todos = results.rows
        res.format({
          'application/json': function () {
            return res.send(todos)
          }
        })
        res.end()
      }
    }
  )
}

function endpointGetSingleTodos (req, res) {
  var tid = req.params.tid
  postgres.query(
    'select * from todos where tid = $1',
    [
      tid
    ],
    function (err, results) {
      if (err) {
        console.log('error selecting todos', err)
        res.sendStatus(500)
        res.end()
      } else {
        var todos = results.rows
        res.format({
          'application/json': function () {
            return res.send(todos[0])
          }
        })
        res.end()
      }
    }
  )
}

function endpointPutTodos (req, res) {
  var tid = req.params.tid
  var body = ''
  req.on('data', function (data) {
    console.log('/todos/:tid got:', body, data)
    body += data
  }).on('end', function () {
    console.log('finalized body:', body.toString())
    try {
      var todo = JSON.parse(body.toString())
      console.log('got todo:', todo)
      console.log('attempting to verify todo')
      if (todo.ttitle) {
        postgres.query(
          'update todos set ttitle = $1 where tid = $2',
          [
            todo.ttitle,
            tid
          ],
          function (err, results) {
            if (err) {
              console.log('error inserting into users:', err)
              res.sendStatus(500)
              res.end()
            } else {
              res.sendStatus(200)
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

function endpointPutTodosComplete (req, res) {
  var tid = req.params.tid
  postgres.query(
    'update todos set tcomplete = true where tid = $1',
    [
      todo.tid
    ],
    function (err, results) {
      if (err) {
        console.log('error updating todos complete:', err)
        res.sendStatus(500)
        res.end()
      } else {
        res.sendStatus(200)
        res.end()
      }
    }
  )
}

function endpointPutTodosIncomplete (req, res) {
  var tid = req.params.tid
  postgres.query(
    'update todos set tcomplete = false where tid = $1',
    [
      todo.tid
    ],
    function (err, results) {
      if (err) {
        console.log('error updating todos incomplete:', err)
        res.sendStatus(500)
        res.end()
      } else {
        res.sendStatus(200)
        res.end()
      }
    }
  )
}

function endpointPostTodos (req, res) {
  console.log('preparing todos for insert')
  var body = ''
  req.on('data', function (data) {
    console.log('/todos got: ', body, data)
    body += data
  }).on('end', function () {
    console.log('finalized body: ', body)
    try {
      var todo = JSON.parse(body.toString())
      console.log('got post data: ', todo)
      console.log('attempting to verify data')
      if (todo.ttitle) {
        console.log('todo verified')
        console.log('adding todo: ', todo)
        postgres.query(
          'insert into todos (ttitle, tcomplete) values ($1, false) returning *',
          [
            todo.ttitle
          ],
          function (err, results) {
            if (err) {
              console.log('error inserting todos:', err)
              res.sendStatus(500)
              res.end()
            } else {
              console.log('inserted todo')
              var todos = results.rows
              res.format({
                'application/json': function () {
                  return res.send(todos[0])
                }
              })
              res.end()
            }
        })
      } else {
        console.log('invalid todo')
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

function endpointDeleteTodos (req, res) {
  var tid = req.params.tid
  postgres.query(
    'delete from todos where tid = $1',
    [
      tid
    ],
    function (err, results) {
      if (err) {
        console.log('error deleting todos:', err, tid)
        res.sendStatus(500)
        res.end()
      } else {
        res.sendStatus(200)
        res.end()
      }
    }
  )
}

// -- program ---------------------------------------------- <

postgres.connect()

console.log('postgress data connected..')

express()
  .use(cors())
  .get('/api/v2/todos', endpointGetTodos)
  .get('/api/v2/todos/:tid', endpointGetSingleTodos)
  .put('/api/v2/todos/:tid', endpointPutTodos)
  .put('/api/v2/todos/:tid/complete', endpointPutTodosComplete)
  .put('/api/v2/todos/:tid/incomplete', endpointPutTodosIncomplete)
  .post('/api/v2/todos', endpointPostTodos)
  .delete('/api/v2/todos/:tid', endpointDeleteTodos)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
