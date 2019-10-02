const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const express = require('express')
const jwt = require('jsonwebtoken')
const path = require('path')

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('./books.db')

// Enable foreign key support
db.get('PRAGMA foreign_keys = ON')

const jwtSecret = process.env.JWT_SECRET
const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10

const app = express()
const port = process.env.PORT || 3000

app.use('/static', express.static('public'))
app.use(bodyParser.json())



/**
 * An express middleware that verifies a token in the authorization header or
 * responds with 403 if the token is missing or invalid
 */
function verifyToken(req, res, next) {
    const token = req.headers['authorization']
    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), jwtSecret)
        if (!decoded.user || !Object.keys(decoded.user).length) {
            throw 'invalid token'
        }

        req.user = decoded.user
        next()
    }
    catch (err) {
        res.status(403).json({error: 'missing or invalid authorization header'})
    }
}


/**
 * Given a user ID, returns a JWT token to the frontend to be used for
 * user authentication
 */
function getToken(id) {
    return {token: jwt.sign({user: {id}}, jwtSecret)}
}


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})


app.post('/login', (req, res) => {
    const { username, password } = req.body

    // Ensure that username and password are in the payload
    if (!username || !password) {
        res.status(400).json({error: 'must provide username and password'})
        return
    }

    // Ensure that the user exists
    db.get('SELECT * FROM users WHERE username = ?', username, (err, user) => {
        if (err) {
            console.error(err)
            res.status(500)
            return
        }

        if (!user) {
            res.status(403).json({error: 'invalid username and/or password'})
            return
        }

        // Validate user password
        bcrypt.compare(password, user.hash, (err, passwordMatched) => {
            if (err) {
                console.error(err)
                res.status(500)
            }
            else if (passwordMatched) {

                // Generate and send JWT token
                res.json(getToken(user.id))
            }
            else {
                res.status(403).json({error: 'invalid username and/or password'})
            }
        })
    })
})


app.post('/register', (req, res) => {
    // Ensure that username, password, and confirmation are in the payload
    const { username, password, confirmation } = req.body
    if (!username) {
        res.status(400).json({error: 'must provide username'})
    }
    else if (!password) {
        res.status(400).json({error: 'must provide password'})
    }
    else if (password !== confirmation) {
        res.status(400).json({error: 'password must match confirmation'})
    }
    else {
        // Hash password
        bcrypt.hash(password, saltRounds, (err, hash) => {

            // Register user
            db.run('INSERT INTO users (username, hash) VALUES (?, ?)', [username, hash], function(err) {
                if (err) {
                    res.status(400).json({error: `user ${username} already exists`})
                    return
                }

                // Return token to frontend so user can login right away
                res.json(getToken(this.lastID, jwtSecret))
            });
        })
    }
})


/**
 * Returns a list of books
 * If keyword is passed, returns a list of books where keyword is somewhere in
 * author, isbn, or title
 */
app.get('/books', verifyToken, (req, res) => {
    let {keyword} = req.query
    if (keyword) {
        keyword = `%${keyword}%`
    }
    else {
        keyword = '%'
    }

    db.all(
        [
            'SELECT',
                [
                    'books.isbn',
                    'books.title',
                    'books.author',
                    'books.year',
                    // 'COUNT(reviews.comment) AS comment_count'
                ].join(','),
            'FROM books LEFT JOIN reviews',
            'ON books.isbn = reviews.book_isbn',
            'WHERE',
                'books.isbn LIKE ? OR',
                'books.title LIKE ? OR',
                'books.author LIKE ?',
            'GROUP BY books.isbn'
        ].join(' '),
        [keyword, keyword, keyword],
        (err, books) => {
            res.json({books})
        }
    )
})


app.post('/reviews', verifyToken, (req, res) => {
    let { isbn, comment } = req.body
    if (!isbn || !comment) {
        res.status(400).json({error: 'must provide isbn and comment'})
        return
    }
    else {
        console.log(req.user.id)
        db.run('INSERT INTO reviews (user_id, book_isbn, comment) VALUES (?, ?, ?)', [req.user.id, isbn, comment], (err) => {
            if (err) {
                console.error(err)
                res.status(400).json({error: 'duplicate entry'})
                return
            }

            db.get('SELECT reviews.comment, reviews.posted_at, users.username FROM reviews JOIN users ON reviews.user_id = users.id WHERE reviews.book_isbn = ? AND users.id = ?', [isbn, req.user.id], (err, review) => {
                if (err) {
                    res.status(500)
                    return
                }

                res.json({review})
            })
        })
    }
})


app.get('/reviews', verifyToken, (req, res) => {
    const { isbn } = req.query
    if (!isbn) {
        res.status(400).json({error: 'must provide isbn'})
        return
    }

    db.all('SELECT reviews.comment, reviews.posted_at, users.username FROM reviews JOIN users ON reviews.user_id = users.id WHERE reviews.book_isbn = ?', [isbn], (err, reviews) => {
        if (err) {
            res.status(500)
            return
        }

        res.json({reviews})
    })
})


app.listen(port, () => {
    console.log(`Listening on port ${port}!`)
})

db.on('trace', console.log)
