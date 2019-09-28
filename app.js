const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const express = require('express')
const jwt = require('jsonwebtoken')
const path = require('path')

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('./books.db')

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
        req.user = jwt.verify(token.replace("Bearer ", ""), jwtSecret)
        next()
    }
    catch {
        res.status(403).json({error: 'missing or invalid authorization header'})
    }
}


/**
 * Given a user ID, returns a JWT token to the frontend to be used for
 * user authentication
 */
function getToken(id) {
    return {token: jwt.sign({id}, jwtSecret)}
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
            db.run('INSERT INTO users (username, hash) VALUES (?, ?)', [username, hash], (err) => {
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
        'SELECT * FROM books WHERE isbn LIKE ? OR title LIKE ? OR author LIKE ?',
        [keyword, keyword, keyword],
        (err, records) => {
            res.json({records})
        }
    )
})


app.listen(port, () => {
    console.log(`Listening on port ${port}!`)
})
