// Highjacks the functionality of all links so the data can be loaded without loading a new page (discount react).
document.querySelectorAll('.nav-redir').forEach(link => {
    link.addEventListener('click', (event) => {
        pageChange(null, new URL(link.href).pathname) // Changes the page, second variable is the url path
        event.preventDefault() // Prevent link from navigating the page.
    })
})

// Function that loads new page data onto the site.
async function pageChange(event, route) {
    event ? event.preventDefault() : null // If called by popstate it prevents it from navigating to its default location.
    
    if(new URL(window.location).pathname == route) return // Prevents the page from reloading the same information.

    const content = document.getElementById('content') // Div for data to be loaded into.
    // Sets attribute on header that is used to style nav indicator
    document.getElementById('mainBody').setAttribute('data-loc', route) 

    // window.scroll(0,0)

    content.classList.add('fade') // Hides pages content
    content.innerHTML = '' // Deletes Page Content

    const url = `https://${window.location.hostname}/api${route}`
    const data = await serverRequest(url, 'GET') // Gets data from server
    
    content.innerHTML = data // Adds data to page
    content.classList.remove('fade') // Shows page content

    

    // Sets document title (relying on data from server resulted in glitchy behavior)
    // It uses the url path (route variable) unless its the index, which has now path.
    document.title = route.length > 1 ? 'NRJohnson | ' + route.substring(1,2).toUpperCase() + route.substring(2) : 'NRJohnson | Home'

    // Adds navigation to browser history.
    addToHistory(route)
}

// Handles all front-end server requests
function serverRequest(url, method) {
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
        xhttp.send()
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
document.getElementById('updatesForm').addEventListener('submit', (event) => {
    event.preventDefault()
    alert('Hello!')
})

// Contact form validation
const form = document.getElementById('contactForm')
form ? form.addEventListener('submit', (event) => {
    event.preventDefault()
    const fields = form.querySelectorAll('.input-text')

    let errors = []

    fields.forEach(inp => {
        const emailValidation = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
        const cleanTitle = inp.getAttribute('cleanTitle')
        inp.value.length < 1 ? errors.push(cleanTitle + ' cannot be empty.') : inp.name == 'email' ? emailValidation.test(inp.value) ? null : errors.push(cleanTitle + ' is invalid.') : null
    })

    myAlert('<h3>Oops...</h4><hr>' + errors.map(err => {
        return '<p>' + err + '</p>'
    }).join(''))
}) : null

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
function myAlert(message, close) {
    const myAlert = document.getElementById('myAlert')
    const text = document.getElementById('myAlertText')

    if(close) {
        myAlert.classList.remove('alert')
        window.setTimeout(() => {text.innerHTML = ''}, 300) // Prevent awekward collapse of box as it fades.
    } else if(message) {
        text.innerHTML = message
        myAlert.classList.add('alert')
    }
}

// Closes custom alert box when "OK" button is pressed.
document.getElementById('myAlertOK').addEventListener('click', () => {
    myAlert(null, true)
})
// Closes custom alert when user clicks outside the box.
document.getElementById('myAlertBack').addEventListener('click', () => {
    myAlert(null, true)
})