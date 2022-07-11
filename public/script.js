// Highjacks the functionality of all links so the data can be loaded without loading a new page (discount react).
document.querySelectorAll('.nav-redir').forEach(link => {
    link.addEventListener('click', (event) => {
        pageChange(null, new URL(link.href).pathname) // Changes the page, second variable is the url path
        event.preventDefault() // Prevent link from navigating the page.
    })
})

// Function that loads new page data onto the site.
async function pageChange(event, route) {
    if(event) {
        event.preventDefault() // If called by popstate it prevents it from navigating to its default location.
        
    } else {
        if(new URL(window.location).pathname == route) return // Prevents the page from reloading the same information.
    }

    const content = document.getElementById('content') // Div for data to be loaded into.
    // Sets attribute on header that is used to style nav indicator
    document.getElementById('mainBody').setAttribute('data-loc', route) 

    // window.scroll(0,0)

    content.classList.add('fade') // Hides pages content
    content.innerHTML = '' // Deletes Page Content

    const url = 'https://' + window.location.hostname + '/api' + route
    const data = await serverRequest(url, 'GET') // Gets data from server
    
    content.innerHTML = data // Adds data to page
    content.classList.remove('fade') // Shows page content

    

    // Sets document title (relying on data from server resulted in glitchy behavior)
    // It uses the url path (route variable) unless its the index, which has now path.
    document.title = route.length > 1 ? 'NRJohnson | ' + route.substring(1,2).toUpperCase() + route.substring(2) : 'NRJohnson | Home'

    // Adds navigation to browser history.
    addToHistory(route)
}

function protectedServerRequest(url, method, data) {
    return new Promise(resolve => {
        grecaptcha.ready(function() {
            grecaptcha.execute('6Lc-pd0gAAAAAOyqsmvkY10zycG3SCQKdelhMEsX', {action: 'submit'}).then(async token => {
                data.token = token
                const resp = await serverRequest(url, method, data)
                resolve(resp)
            });
        });
    })
    
}

// Handles all front-end server requests
function serverRequest(url, method, data) {
    return new Promise(resolve => {
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && (this.status == 200 || this.status == 201)) {
                // If response from server is good, return the response
                resolve(this.response)
            } else if(this.readyState == 4) {
                // If response is bad, return error status html to loaded into page.
                resolve('<h1>Error ' + this.status + '</h1><p>Could not get data from server</p>')
            }
        };
        
        xhttp.open(method, url);
        if(data) {
            xhttp.setRequestHeader( 'Content-Type', 'application/json' )
            xhttp.send(JSON.stringify(data))
        } else {
            xhttp.send()
        }
    })
}

// Takes over browser back button
window.addEventListener('popstate', (e) => {
    const location = history.state;
    // Changes page data if item was added to history, else it's allowed to navigate back in it's defualt way.
    location ? pageChange(e, location) : window.history.back()
    
});

// Adds page state to browser history
function addToHistory(route) {
    // If the current state is different than the previous, the new state is added to history
    // It also changes the current url (push state third param), which allows the user to refresh the page without returning to the home page.
    history.state != route ? history.pushState(route, null, route) : null
}

// Signup form validation
async function signUp(event, form) {
    event.preventDefault() // Prevents default link navigation when javascript is enabled
    const fields = form.querySelectorAll('.input-text')
    let data = {} // Form data for the server request
    let errors = ['<h4>Oops...</h4>'] // Errors array

    const button = form.querySelectorAll('.btn')[0]
    button.classList.add('loading')
    button.disabled = true

    // Checks each input for errors. If error found it adds it to the errors array, else it adds it to the data object.
    fields.forEach(inp => {
        if(inp.value.length < 1) { // All inputs are required
            errors.push('<p>' + inp.getAttribute('cleanTitle') + ' cannot be empty.</p>')
        } else if(inp.name == 'email') { // If email checks format validation
            const emailValidation = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            emailValidation.test(inp.value) ? data[inp.name] = inp.value : errors.push('<p>Email invalid.</p>')
        } else if(inp.name == 'name' && inp.value.split(' ').length < 2) { // Checks for first and last name inclusion.
            errors.push('<p>Please inlcude both your first and last name.</p>')
        } else { // If no errors it is added to data object.
            data[inp.name] = inp.value
        }
    })
    if(errors.length > 1) { // If errors send to user.
        myAlert(errors.join(''), false, null, true)
    } else {
        // Sends 'POST' request to server to add user to mailchimp.
        const req = await protectedServerRequest('https://' + window.location.hostname + '/api/signup', 'POST', data) // Sends data to server
        const resp = JSON.parse(req) // Parsed server response.
        // If response is good, sends confirmation message to user.
        if(resp.ok) {
            myAlert(
                "<p>Hello " + fields[0].value.split(' ')[0] + "!</p><p>Thank you for signing up to receive updates.</p>"
            )
        } else {
            // If server response has an error it sends that to the user.
            if(resp.resp[0]) {
                myAlert(
                    resp.resp[0].error_code == 'ERROR_CONTACT_EXISTS' ? 'Email address already added. Please use a different one.' : 'Error signing you up. Please try again later.',
                    false, null, true
                )
            } else {
                myAlert(resp.resp, false, null, true)
            }
            
        }
    }
    button.classList.remove('loading')
    button.disabled = false
    
}

// Contact form validation
async function submitContact(event, form) {
    event.preventDefault() // Prevents default link navigation when javascript is enabled

    const button = form.querySelectorAll('.btn')[0]
    button.classList.add('loading') // Adds loading animation to form button.
    button.disabled = true

    const fields = form.querySelectorAll('.input-text')

    let errors = []
    let data = {}

    fields.forEach(inp => {
        const emailValidation = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
        const cleanTitle = inp.getAttribute('cleanTitle')
        if(inp.value.length < 1) {
            errors.push(cleanTitle + ' cannot be empty.')
        } else if(inp.name == 'email' && !emailValidation.test(inp.value)) {
            errors.push(cleanTitle + ' is invalid.')
        } else {
            if(inp.name == 'subscribe') {
                data[inp.name] = inp.checked
            } else {
                data[inp.name] = inp.value
            }
        }
    })

    if(errors.length > 0) {
        myAlert('<h3>Oops...</h4><hr>' + errors.map(err => {
            return '<p>' + err + '</p>'
        }).join(''), false, null, true)
    } else {
        const res = await protectedServerRequest('https://' + window.location.hostname + '/api/contact', 'POST', data)// Sends data to server using reCAPTCHA
        const resp = JSON.parse(res)
        
        if(resp.ok) {
            myAlert('Your message had been sent!')
        } else {
            myAlert(resp.resp[0] ? 'Error sending your message. Please try again later' : resp.resp, false, null, true)
        }
        
    }
    button.classList.remove('loading')
    button.disabled = false
}

// Detects mobile menu button press
let mobileToggle = document.getElementById('mobileToggle')
mobileToggle.addEventListener('click', event => {
    event.preventDefault()
    toggleMobileMenu(null)
})

// Detects when the user touches outside of the mobile menu while it's open.
document.getElementById('mobileNavBack').addEventListener('click', event => {
    event.preventDefault()
    toggleMobileMenu(true)
})

// Opens and closes the mobile menu
function toggleMobileMenu(close) {
    // "close" variable to to allow the menu to be closed rather than toggled.
        // This prevents unwanted opening of the menu.
    const main = document.getElementById('mainBody')
    close ? main.classList.remove('mobile-toggled') : main.classList.toggle('mobile-toggled')
}

// Toggles my custom alert box.
function myAlert(message, close, event, err) {
    event ? event.preventDefault() : null
    const myAlert = document.getElementById('myAlert')
    const text = document.getElementById('myAlertText')

    myAlert.classList.remove('err')
    err ? myAlert.classList.add('err') : null    

    if(close) {
        myAlert.classList.remove('alert')
        window.setTimeout(() => {text.innerHTML = ''}, 300) // Prevent awekward collapse of box as it fades.
    } else if(message) {
        text.innerHTML = message
        myAlert.classList.add('alert')
    }
}

// Closes custom alert box when "OK" button is pressed.
document.getElementById('myAlertOK').addEventListener('click', event => {
    myAlert(null, true, event)
})
// Closes custom alert when user clicks outside the box.
document.getElementById('myAlertBack').addEventListener('click', event => {
    myAlert(null, true, event)
})