// The site is a single page app. So the front end makes requests to an "api" route that routes through this page.
// The pages rendered here are pieces meant to be added to the "main.pug" page without the page being reloaded.

const express = require('express')
const router = express.Router()

// Requests the data from the './functions/ops.js' file from the function in 'siteOps'.
router.get(['/', '/:page', '/:page/:story'], async (req, res) => {
    await req.getData(req.params.page || '', req.params.story).then(resp => {
        res.status(200).send(resp)
    }).catch(err => {
        res.status(err.status || 500).send(err)
    })
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
            console.log(req.body)
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
                from: 'Stories - NRJohnson <system@nrjohnson.net>',
                to: 'contact@nrjohnson.net',
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

            // Sends notification that I have received a new subscriber
            var mailOptions = {
                from: 'Stories - NRJohnson <system@nrjohnson.net>',
                to: 'contact@nrjohnson.net',
                subject: 'New Subscriber!',
                html: `<h1>New Subscriber!</h1>
                    <p>${req.body.name} (${req.body.email}) has subscribed to notifications!</p>`
            };
            await req.sendMail(mailOptions) // Sends me the email.
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

// router.get('/:page', (req, res) => {

// })



module.exports = router