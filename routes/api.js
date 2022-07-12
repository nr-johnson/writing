// The site is a single page app. So the front end makes requests to an "api" route that routes through this page.
// The pages rendered here are pieces meant to be added to the "main.pug" page without the page being reloaded.

const express = require('express')
const router = express.Router()
const request = require('request')

// Get content for home page
router.get('/', async (req, res) => {
    let stories = await req.findMany('writing', 'stories', {published: true})
    stories.sort(function(a, b){
        return a.date < b.date ? -1 : 1 
        return 0
    });
    res.render('pages/index', {
        story: stories[0]
    })
})

// Gets content for blog page
router.get('/stories', async (req, res) => {
    let stories = await req.findMany('writing', 'stories', {published: true})
    
    res.render('pages/stories', {
        stories: stories
    })
})

// Gets Map page
router.get('/map', (req, res) => {
    
    res.render('pages/map', {
        mobile: req.device.type
    })
})

// Gets Contect Me page
router.get('/contact', (req, res) => {
    res.render('pages/contact')
})

// Contact form post
router.post('/contact', (req, res) => {
    captchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${req.body.token}`;
    request(captchaUrl, async (error, response, body) => {
        const score = JSON.parse(body).score
        console.log(`Captcha score: ${score}`)
        if(score >= 0.4) {
            const data = {
                email_address: req.body.email,
                tags: ['Contact Form'],
                merge_fields: 
                    {
                        FNAME: req.body.firstName,
                        LNAME: req.body.lastName
                    },
                interests: {
                    '8bd27fd3aa': true
                },
                status: req.body.subscribe ? 'subscribed' : 'unsubscribed'
            }
            var mailOptions = {
                from: 'Stories - NRJohnson <contact@nrjohnson.net>',
                to: 'main.nrjohnson@gmail.com',
                subject: 'Contact Form',
                html: `<p>From: ${req.body.firstName} ${req.body.lastName} (${req.body.email})</p>
                    <p>Subscribed: ${req.body.subscribe}</p>
                    <p>Message:</p>
                    <p>${req.body.message}</p>`
            };
            const mailSent = await req.sendMail(mailOptions)
            await req.addUpdateChimp(data)
            res.send(mailSent)
        } else {
            res.send({ok: false, resp: 'Message not sent. Captcha score too low.'})
        }
    })
    
})

router.post('/signup', async (req, res) => {
    captchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${req.body.token}`;
    request(captchaUrl, async (error, response, body) => {
        const score = JSON.parse(body).score
        console.log(`Captcha score: ${score}`)
        if(score >= 0.4) {
            const data = {
                email_address: req.body.email,
                tags: ['Subscribe Form'],
                merge_fields: 
                    {
                        FNAME: req.body.name.split(' ')[0],
                        LNAME: req.body.name.split(' ')[1]
                    },
                interests: {
                    '8bd27fd3aa': true
                },
                status: 'subscribed'
            }
            let submit = await req.addUpdateChimp(data)
            res.send(submit)
        } else {
            res.send({ok: false, resp: 'Captcha score too low.'})
        }
        
    })
    
})

router.get('/error', (req, res) => {
    const err = req.session.error
    req.session.error = null

    res.render('pages/error')
})

module.exports = router