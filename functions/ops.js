const nodemailer = require('nodemailer');
const chimp = require("mailchimp-marketing");
const path = require('path')
const pug = require('pug')

// Sets MailChimp credentials
chimp.setConfig({
    apiKey: process.env.MAILCHIMP_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX,
});

// Functions that arent's related to MongoDB
function siteOps() {
    return (req, res, next) => {
        /*
            Ok... Phew... Lot of work figuring this out.
            So the 'getData' function below gathers the data for the different routes.
            I discovered a function in the 'pug' module that allows me to render the files without sending it to the client at the same time.
            This allowed me to set the rendered html as a variable to be returned to where ever it's needed.
            The function is called by the main server on initial page load and from the 'api' routes that are called from the front end.
            The point of doing it this way was to prevent the app from making a bunch of http requests to itself.
        */
        req.getData = (route, story) => {
            const folder = `${req.root}/views/pages/`
            return new Promise((resolve, reject) => {
                // If the request is a specific story it handles the request differently then the other routes (extra path).
                if(story) {
                    req.client.get(`/writing/stories?_id=${story}`).then(resp => {
                        // If the database returns with data, send html.
                        if(resp.data.length > 0) {
                            const storyHtml = pug.renderFile(`${folder}story.pug`, {
                                story: resp.data[0]
                            })
                            resolve(storyHtml)
                        } else { // Server responded but data was empty. Sends a 404 error.
                            let err = new Error(`Cannot find page with route "/${route}/${story}"`);
                            err.status = 404;
                            reject(err)
                        }
                    }).catch(err => {
                        reject(err)
                    })
                } else {
                    // Depending on the route, it gathers the data and returns it.
                    switch(route) {
                        // Home route
                        case '':
                            // This is the default route (the index page).
                            // Gets stories from database then sorts them by date.
                            req.client.get('/writing/stories?published=true').then(resp => {
                                let stories = resp.data
                                stories.sort(function(a, b){
                                    return a.date > b.date ? -1 : a.date < b.date ? 1 : 0
                                });
                                const indexHTML = pug.renderFile(`${folder}index.pug`, {
                                    story: stories[0]
                                })
                                resolve(indexHTML)
                            }).catch(err => {
                                reject(err)
                            })
                            break
                        // Stories route
                        case 'stories':
                            // Gets stories from database then sorts them by date.
                            req.client.get('/writing/stories?published=true').then(resp => {
                                let stories = resp.data
                                stories.sort(function(a, b){
                                    return a.date > b.date ? -1 : a.date < b.date ? 1 : 0
                                });
                                const storiesHtml = pug.renderFile(`${folder}stories.pug`, {
                                    stories: stories
                                })
                                resolve(storiesHtml)
                            }).catch(err => {
                                reject(err)
                            })
                            break
                        
                        // Map Route
                        case 'map':
                            const mapHtml = pug.renderFile(`${folder}map.pug`, {
                                mobile: req.query.mobile ? req.query.mobile === 'true' : req.useragent.isMobile
                            })
                            resolve(mapHtml)
                            break

                        // Contact Route
                        case 'contact':
                            const conactHtml = pug.renderFile(`${folder}contact.pug`)
                            resolve(conactHtml)
                            break

                        // 404 Catch
                        default:
                            let err = new Error(`Cannot find page with route "/${route}"`);
                            err.status = 404;
                            reject(err)
                    }
                }
            })
        }


        // Adds or updates memeber in mailchimp.
        req.addUpdateChimp = data => {
            return new Promise(async resolve => {
                try {
                    const response = await chimp.lists.setListMember(
                        process.env.MAILCHIMP_AUDIENCE_ID,
                        data.email_address,
                        data
                    );
                    console.log(`Chimp Status: ${response.status}`)
                    resolve(response.status == data.status ? {ok: true, resp: response} : {ok: false, resp: response})
                } catch(err) {
                    console.log(`Chimp Status: ${err.status}`)
                    console.log(`Chimp Error Response: ${JSON.parse(err.response.text).detail}`)
                    resolve({ok: false, resp: err})
                }
            })
            
        }
        
        req.sendMail = (options) => {
            return new Promise(resolve => {
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'main.nrjohnson',
                        pass: process.env.GMAIL_PASS
                    }
                });
                transporter.sendMail(options, function(error, info){
                    if (error) resolve({ok: false, resp: error})
                    if(info.accepted.length > 0) {
                        console.log('Email Sent to ' + options.to)
                    } else {
                        console.log('Email not sent.')
                    }
                    resolve({ok: true, resp: info})
                });
            })
        }

        next()
    }
}

module.exports = { siteOps }