const main = document.querySelector('main')

const loginContainer = document.querySelector('#login-container')
const loginForm = loginContainer.querySelector('form')

const logoutContainer = document.querySelector('#logout-container')
const logoutLink = logoutContainer.querySelector('a')

// Clear session when user logs out
logoutLink.addEventListener('click', () => {
    user = {}
    localStorage.removeItem('user')
    requireLogin()
})

const registerContainer = document.querySelector('#register-container')
const registerForm = registerContainer.querySelector('form')

const loginRegisterLinks = document.querySelector('#login-register-links')

const home = document.querySelector('#home')
const hometBody = home.querySelector('tbody')
const searchForm = home.querySelector('form')

const commentsModal = document.querySelector('#commentsModalLongTitle')
const commentsContainer = document.querySelector('#comments-container')
const commentTextArea = document.querySelector('textarea')
const postCommentButton = document.querySelector('#post-comment')

const errorAlert = document.querySelector('#error-alert')

let user = JSON.parse(localStorage.getItem('user')) || {}

const totalStars = 5

// Ensure user is logged in initially
requireLogin()

// Render view associated with hash link when page is first loaded
onHashChange()

// Render view associated with hash link when hash link changes
window.addEventListener('hashchange', onHashChange)


/**
 * Simple router
 */
function onHashChange() {
    const hash = (location.hash && location.hash.slice(1)) || ""
    hideAll()
    switch (hash) {
        case "":
        case "/home":
            requireLogin(renderHome)
            break
        case "/login":
            renderLogin()
            break
        case "/register":
            renderRegister()
            break
        default:
            render404()
            break
    }
}


function userLoggedIn() {
    return Object.keys(user).length && user.token
}


function requireLogin(callback=()=>{}) {
    if (!userLoggedIn() && location.hash != '#/login' && location.hash != '#/register') {
        location.hash = '#/login'
    }
    else {
        callback()
    }
}

function renderLogin() {
    if (userLoggedIn()) {
        redirectToHome()
        return
    }

    show(loginContainer)
    show(loginRegisterLinks)
}


function renderRegister() {
    if (userLoggedIn()) {
        redirectToHome()
        return
    }

    show(registerContainer)
    show(loginRegisterLinks)
}


function appendReview(commentsContainer, review) {
    const div = document.createElement('div')
    const authorInfo = document.createElement('small')
    authorInfo.classList.add('text-muted')
    authorInfo.append(`${review.username} posted at ${review.posted_at}`)
    const commentDiv = document.createElement('div')
    commentDiv.classList.add('mb-2')
    commentDiv.append(review.comment)
    div.append(authorInfo, commentDiv)
    commentsContainer.append(div)
}


function renderBooks(data) {
    hometBody.innerHTML = ''
    if (data.error) {
        showError(data.error)
        return
    }

    data.books.forEach((book) => {
        const keys = Object.keys(book)
        const tr = document.createElement('tr')
        keys.slice(0, keys.length).forEach((key) => {
            const td = document.createElement('td')
            td.append(book[key])
            tr.append(td)
        })

        const td = document.createElement('td')
        const commentsButton = document.createElement('span')
        commentsButton.classList.add('oi', 'oi-comment-square')
        commentsButton.addEventListener('click', () => {
            commentsModal.innerHTML = `${book.title}'s Reviews`

            fetch(
                `/reviews?isbn=${book.isbn}`,
                {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                }
            )
            .then((response) => response.json())
            .then((data) => {
                const {reviews} = data
                commentsContainer.innerHTML = ''
                if (reviews.length < 1) {
                    const noCommentsDiv = document.createElement('div')
                    noCommentsDiv.classList.add('text-center')
                    noCommentsDiv.append('No reviews yet')
                    commentsContainer.append(noCommentsDiv)
                    return
                }

                reviews.forEach(appendReview.bind(null, commentsContainer))
            })

            postCommentButton.onclick = () => {
                const comment = commentTextArea.value
                if (!comment) {

                }

                const isbn = book.isbn

                fetch(
                    `/reviews`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${user.token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({isbn, comment})
                    }
                )
                .then((response) => response.json())
                .then((data) => {
                    commentTextArea.value = ''
                    const { review } = data
                    if (review) {
                        appendReview(commentsContainer, review)
                    }
                })
            }

            $('#commentsModalLong').modal()
        })

        td.append(commentsButton)

        // td.append(` (${book.comment_count})`)

        tr.append(td)
        hometBody.append(tr)
    })

    show(home)
}


function renderHome() {
    show(logoutContainer)
    fetch(
        '/books',
        {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        }
    )
    .then((response) => response.json())
    .then(renderBooks)
}


function redirectToHome() {
    location.hash = ''
}


function hideAll() {
    show(loginRegisterLinks, false)
    show(logoutContainer, false)

    errorAlert.classList.replace('d-block', 'd-none')

    show([...main.children], false)
}


function show(elements, showing=true) {
    const f = showing ? 'remove' : 'add'
    if (Array.isArray(elements)) {
        elements.forEach((e) => e.classList[f]('d-none'))
    }
    else {
        elements.classList[f]('d-none')
    }
}


function showError(err) {
    errorAlert.innerHTML = err
    errorAlert.classList.replace('d-none', 'd-block')
}


loginForm.addEventListener('submit', (e) => {
    // Disable browser's default behavior when form is submitted
    e.preventDefault()
    const usernameField = loginForm.querySelector('input[name=username]')
    const passwordField = loginForm.querySelector('input[name=password]')
    const username = usernameField.value
    const password = passwordField.value

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username, password})
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.error) {
            showError(data.error)
            return
        }

        usernameField.value = passwordField.value = ''

        user.username = username
        user.token = data.token
        localStorage.setItem('user', JSON.stringify(user))

        redirectToHome()
    })
})


registerForm.addEventListener('submit', (e) => {
    // Disable browser's default behavior when form is submitted
    e.preventDefault()

    const usernameField = registerForm.querySelector('input[name=username]')
    const passwordField = registerForm.querySelector('input[name=password]')
    const confirmationField = registerForm.querySelector('input[name=confirmation]')

    const username = usernameField.value
    const password = passwordField.value
    const confirmation = confirmationField.value

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username, password, confirmation})
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.error) {
            showError(data.error)
            return
        }

         usernameField.value = passwordField.value = confirmationField.value = ''

         user.username = username
         user.token = data.token
         localStorage.setItem('user', JSON.stringify(user))

         redirectToHome()
    })
})


searchForm.addEventListener('submit', (e) => {
    // Disable browser's default behavior when form is submitted
    e.preventDefault()

    const keyword = searchForm.querySelector('input[name=keyword]').value
    fetch(
        `/books?keyword=${keyword}`,
        {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        }
    )
    .then((response) => response.json())
    .then(renderBooks)

})
