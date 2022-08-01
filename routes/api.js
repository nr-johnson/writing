// The site is a single page app. So the front end makes requests to an "api" route that routes through this page.
// The pages rendered here are pieces meant to be added to the "main.pug" page without the page being reloaded.

const express = require('express')
const router = express.Router()

// Get content for home page
router.get('/', async (req, res) => {
    // Gets stories from database then sorts them by date.
    // let stories = await req.findMany('writing', 'stories', {published: true})
    req.client.get('/writing/stories?published=true').then(resp => {
        let stories = resp.data
        stories.sort(function(a, b){
            return a.date < b.date ? -1 : a.date > b.date ? 1 : 0
        });
        res.render('pages/index', {
            story: stories[0] // Sends the latest story to home page.
        })
    }).catch(err => {
        res.status(500).send(err)
    })
})

// Gets content for stories page
router.get('/stories', async (req, res) => {
    req.client.get('/writing/stories?published=true').then(resp => {
        res.render('pages/stories', {
            stories: resp.data
        })
    }).catch(err => {
        res.status(500).send(err)
    })
})

// Gets info about a specific story
router.get('/story=:id', async(req, res) => {
    req.client.get(`/writing/stories?_id=${req.params.id}`).then(resp => {
        res.render('pages/story', {
            story: resp.data[0]
        })
    }).catch(err => {
        res.status(500).send(err)
    })
})

// Gets Map page
router.get('/map', (req, res) => {
    // 'mobile' variable is used to load the map iframe only if not on mobile.
    res.render('pages/map', {
        mobile: req.query.mobile ? req.query.mobile === 'true' : req.useragent.isMobile
    })
})

// Gets Contect Me page
router.get('/contact', (req, res) => {
    res.render('pages/contact')
})

// Contact form post
router.post('/contact', (req, res) => {
    captchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${req.body.token}`;
    // Sends request to google captcha for score.
    req.client.get(captchaUrl).then(async resp => {
        const score = resp.data.score
        console.log(`Captcha score: ${score}`)
        // If captcha score is above 0.4 it can be assumed that the request was made by a human and the email is sent. 
        if(score >= 0.4) {
            // Info for mailchimp
            const data = {
                email_address: req.body.email,
                tags: ['Contact Form'], //Used for contact source.
                merge_fields: 
                    {
                        FNAME: req.body.firstName,
                        LNAME: req.body.lastName
                    },
                interests: {
                    '8bd27fd3aa': true // This is the Group 'Sites>Stories'
                },
                status: req.body.subscribe ? 'subscribed' : 'unsubscribed' // If they check the sign up check box they are subscribed.
            }
            // Options for email sent to me.
            var mailOptions = {
                from: 'Stories - NRJohnson <contact@nrjohnson.net>',
                to: 'main.nrjohnson@gmail.com',
                subject: 'Contact Form',
                html: `<p>From: ${req.body.firstName} ${req.body.lastName} (${req.body.email})</p>
                    <p>Subscribed: ${req.body.subscribe ? true : false}</p>
                    <p>Message:</p>
                    <p>${req.body.message}</p>`
            };
            const mailSent = await req.sendMail(mailOptions) // Sends me the email.
            await req.addUpdateChimp(data) // Attempts to add a new mail chimp contact.
            res.send(mailSent) // Sends response from email back to the user.
        } else { // If captcha score is too low it rejects the request.
            res.send({ok: false, resp: 'Message not sent. Captcha score too low.'})
        }
    }).catch(err => {
        res.status(500).send(err)
    })
    
})

router.post('/signup', async (req, res) => {
    captchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${req.body.token}`;
    // Sends request to google captcha for score.
    req.client.get(captchaUrl).then(async resp => {
        const score = resp.data.score
        console.log(`Captcha score: ${score}`)
        // If captcha score is above 0.4 it can be assumed that the request was made by a human and the email is sent. 
        if(score >= 0.4) {
            // new MailChimp memeber info.
            const data = {
                email_address: req.body.email,
                tags: ['Subscribe Form'], // Subscriber source
                merge_fields: 
                    {
                        FNAME: req.body.name.split(' ')[0],
                        LNAME: req.body.name.split(' ')[1]
                    },
                interests: {
                    '8bd27fd3aa': true // Group: Sites > Stories
                },
                status: 'subscribed'
            }
            let submit = await req.addUpdateChimp(data) // Attempts to add new MailChimp member.
            res.send(submit) // Send response from MailChimp function to user.
        } else { // If captcha score is too low it rejects the request.
            res.send({ok: false, resp: 'Captcha score too low.'})
        }
    }).catch(err => {
        res.status(500).send(err)
    })
    
})

router.get('/about', async (req, res) => {
    const id = req.query.id
    const route = req.query.route

    req.client.get(`/writing/stories?_id=${id}`).then(resp => {
        const story = resp.data
        req.session.message = {err: false, msg: `<h4>About ${story[0].title}</h4>${story[0].about}`}

        res.redirect(`${route}#myAlert`)
    }).catch(err => {
        res.status(500).send(err)
    })
})

// Error page
router.get('/error', (req, res) => {
    const err = req.session.error
    req.session.error = null

    res.render('pages/error')
})

router.get('/:page', (req, res) => {
    let err = new Error('Not Found');
    err.status = 404;
    res.status(404)
    res.render('pages/error', {
        message: err.message,
        error: req.dev ? err : {}
    })
})



module.exports = router