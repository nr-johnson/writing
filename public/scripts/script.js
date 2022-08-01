const alertBox = document.getElementById('myAlert')
alertBox.addEventListener('load', alertBox.getAttribute('data-message') ? myAlert(alertBox.getAttribute('data-message')) : null)

// Toggles my custom alert box.
function myAlert(message, close, event, err) {
    event ? event.preventDefault() : null // Prevents link navigation if link is used.
    const myAlert = document.getElementById('myAlert')
    const text = document.getElementById('myAlertText') // Div containing alert box text

    // Removes errors which will be re-added if it is an error.
    myAlert.classList.remove('err')
    err ? myAlert.classList.add('err') : null    

    // If the 'close' variable is true it closes the box, otherwise it opens it.
    if(close) {
        myAlert.classList.remove('alert')
        window.setTimeout(() => {text.innerHTML = ''}, 300) // Prevent awekward collapse of box as it fades.
    } else if(message) {
        message ? text.innerHTML = message : null;
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

// Highjacks the functionality of all links so the data can be loaded without loading a new page (discount react).
setLinkEvents()
function setLinkEvents() {
    document.querySelectorAll('.nav-redir').forEach(link => {
        link.addEventListener('click', (event) => {
            pageChange(null, new URL(link.href).pathname) // Changes the page, second variable is the url path
            event.preventDefault() // Prevent link from navigating the page.
        })
    })
}

let loading = false
// Function that loads new page data onto the site.
async function pageChange(event, route) {
    if(event) {
        event.preventDefault() // If called by popstate it prevents it from navigating to its default location.
    } else {
        if(new URL(window.location).pathname == route) return // Prevents the page from reloading the same information.
    }
    
    

    const content = document.getElementById('content') // Div for data to be loaded into.
    const head = document.getElementsByTagName('head')[0] // Document 'head' tag.

    /*
        The 'loading' variable is used to prevent loading in the new page one is currently being loaded.
        Without disabling interaction the user can rapidly swap menus which will break the site and cause major glitching.
    */
    if(!loading) {
        loading = true

        // Adds navigation to browser history.
        addToHistory(location.pathname)

        // Sets attribute on header that is used to style nav indicator
        document.getElementById('mainBody').setAttribute('data-loc', route) 

        // window.scroll(0,0)

        content.classList.add('fade') // Hides pages content
        content.innerHTML = '' // Deletes Page Content
        // Removes elements from the head that are specfic to the previosly loaded page.
        head.querySelectorAll('.var-head').forEach(tag => {
            tag.parentNode.removeChild(tag)
        })

        const url = 'https://' + window.location.hostname + '/api' + route
        const data = await serverRequest(url, 'GET') // Gets data from server

        // Seperates content into head elements and body elements.
        const sep = data.split("<hr class='sep'>")
        const holdiv = document.createElement('div')
        holdiv.innerHTML = sep[1] ? sep[0] : ''
        
        while(holdiv.children.length > 0) {
            head.append(holdiv.children[0])
        }
        content.innerHTML = sep[1] ? sep[1] : sep[0] // Adds data to page
        content.classList.remove('fade') // Shows page content

        

        // Sets document title (relying on data from server resulted in glitchy behavior)
        // It uses the url path (route variable) unless its the index, which has now path.
        if(route.length > 24) {
            document.title = 'NRJohnson | ' + document.getElementById('title').innerHTML
        } else {
            document.title = route.length > 1 ? 'NRJohnson | ' + route.substring(1,2).toUpperCase() + route.substring(2) : 'NRJohnson | Home'
        }

        // Adds navigation to browser history.
        addToHistory(route)

        if(route == '/map') loadFrame() // Loads map iframe if page loaded is the map page.

        loading = false // Reenables menu interaction

        addTipEvents() // Adds event listeners to any elements with the 'data-tip' attribute.
        setLinkEvents() // Adds event listeners to any links that navigate locally.
    }

    /*
        The 'loading' variable worked to prevent the page from breaking.
        However, if the user to spam the menu the 'loading' variable will be stuck in true.
        The timeout ensures that the menu will always be enabled after a brief pause.
    */
    setTimeout(() => { loading = false }, 250)
}

// This loads in the iframe containing the map. This is done using JS because it won't function without it. So a message will be displayed by default if this function is not called.
function loadFrame() {
    const div = document.getElementById('map')
    const button = document.getElementById('mapButton')
    const frame = document.createElement('iframe')
    const newDiv = document.createElement('div')

    /*
        Creates a new div and a new iframe. Sets the appropriate attributes for both.
        It clears the content of the target parent div,
        Appends the iframe to the new div, then appends the new div to the parent div.
    */

    newDiv.id = 'mapDiv'

    frame.id = 'mapFrame'
    frame.src = 'https://stories.nrjohnson.net/worldmap?frame=true'
    frame.title = "NRJohnson's Interactive Map"
    frame.setAttribute('data-blockRight', '© Copyright NRJohnson')

    div.innerHTML = ''
    newDiv.appendChild(frame)
    div.appendChild(newDiv)

    button.classList.remove('d-none')

    //- Event Listeners to disable and enable scroll when hovering over the map.
    frame.addEventListener('mouseover', () => {disableScroll()})
    frame.addEventListener('mouseout', () => {enableScroll()})
}

// Calls the 'serverRequest' function after generating and adding a capthca token.
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

    // Adds loading animation to button
    const button = form.querySelectorAll('.btn')[0]
    button.classList.add('loading')
    button.disabled = true

    // Checks each input for errors. If error found it adds it to the errors array, else it adds it to the data object.
    fields.forEach(inp => {
        if(inp.value.length < 1) { // All inputs are required
            errors.push('<p>' + inp.getAttribute('data-cleanTitle') + ' cannot be empty.</p>')
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
            myAlert('Error signing you up. Please try again later use another email address.', false, null, true)
            
        }
    }
    // Removes button loading animation
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

    // Validates each form field. If there is an error it adds that error to the array, else it adds the key-value to the data object.
    fields.forEach(inp => {
        const emailValidation = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
        const cleanTitle = inp.getAttribute('data-cleanTitle') // Attribute stored on the input element to provide a good looking name for the user.
        if(inp.value.length < 1) { // Each input is required and cannot be empty.
            errors.push(cleanTitle + ' cannot be empty.')
        } else if(inp.name == 'email' && !emailValidation.test(inp.value)) { // If email check against validation regex.
            errors.push(cleanTitle + ' is invalid.')
        } else { // No errors, add to 'data'
            if(inp.name == 'subscribe') { // Checkboxes return 'on', so if checkbox set as boolean.
                data[inp.name] = inp.checked 
            } else {
                data[inp.name] = inp.value
            }
        }
    })

    // If 'errors' array is not empty, send error to user.
    if(errors.length > 0) {
        myAlert('<h3>Oops...</h4><hr>' + errors.map(err => {
            return '<p>' + err + '</p>'
        }).join(''), false, null, true)
    } else {
        // Send data to server through with captcha.
        const res = await protectedServerRequest('https://' + window.location.hostname + '/api/contact', 'POST', data)// Sends data to server using reCAPTCHA
        const resp = JSON.parse(res)
        
        if(resp.ok) {
            myAlert('Your message had been sent!')
        } else {
            myAlert(resp.resp, false, null, true)
        }
        
    }
    // Removes button loading animation
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

// Stops scrolling when interacting with the map.
function disableScroll() {
    const body = document.getElementById('main')
    const bodWidth = body.offsetWidth
    body.style.overflow = 'hidden'

    // This prevents the glitchy effect from the window resizing when the scroll bar is removed.
    if(body.offsetWidth > bodWidth) {
        body.style.paddingRight = (body.offsetWidth - bodWidth) + 'px'
    }
}

// Reenables scrolling when not interacting with the map.
function enableScroll() {
    const body = document.getElementById('main')
    body.style.overflow = 'unset'
    body.style.paddingRight = 'unset'
    body.style.overflowX = 'hidden'
}

// I made a custom tooltip using the 'data-tip' attribute.
// Most of the details for the tooltips are handled using css, but I wanted to add mouse tracking to make it feel smoother.
addTipEvents() // Calls the function to add event listeners on page load. Also class in the 'pageChange' function.
function addTipEvents() {
    // Grabs all elemenets with the 'data-tip' attribute.
    document.querySelectorAll('[data-tip]').forEach(link => {
        // Adds listener to each.
        link.addEventListener('mousemove', (e) => { 
            link.classList.add('moving') // Prevents css transition timing.

            // Mouse positions
            let mouseX = e.clientX
            let mouseY = e.clientY

            // Elements objective position in the window
            const pos = link.getBoundingClientRect()
            const posX = pos.left
            const posY = pos.top

            // custom css properties are used to adjust to tips. This is done because the tips are psudo elements and can't be directly edited with javascript.
            document.documentElement.style.setProperty('--tempY', ((mouseY - posY) - 5) + 'px')
            document.documentElement.style.setProperty('--tempX', ((mouseX - posX) - 5) + 'px')
        })
    })
}