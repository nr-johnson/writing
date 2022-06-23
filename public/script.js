// Highjacks the functionality of all links so the data can be loaded without loading a new page (discount react).
document.querySelectorAll('.nav-redir').forEach(link => {
    const content = document.getElementById('content')
    link.addEventListener('click', async (event) => {
        event.preventDefault()
        content.classList.add('fade')
        content.innerHTML = ''

        const path = new URL(link.href).pathname
        const url = `https://${window.location.hostname}/api${path}`
        const data = await serverRequest(url, 'GET')
        
        content.innerHTML = data
        content.classList.remove('fade')
    })
})

function serverRequest(url, method) {
    return new Promise(resolve => {
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && (this.status == 200 || this.status == 201)) {
                resolve(this.response)
            } else if(this.readyState == 4) {
                resolve('<h1>Error ' + this.status + '</h1><p>Could not get data from server</p>')
            }
        };
        
        xhttp.open(method, url);
        xhttp.send()
    })
}