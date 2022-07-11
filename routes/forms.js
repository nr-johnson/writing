const router = require('express').Router()
const { response } = require('express')
const request = require('request')

// Submits sign up for updates form when front end javascript is disabled.
router.post('/signup', async (req, res) => {
    // Goes through inputs and adds errors if they are detected.
    const errors = []
    if(req.body.name.length < 1) { //Name must be included
        errors.push('<p>Name cannot be empty.</p>')
    } else if(req.body.name.split(' ').length < 2) { // Name must include first and last name
        errors.push('<p>Please include your first and last name.</p>')
    }
    const emailValidation = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    if(req.body.email.length < 1) { // Email is required
        errors.push('<p>Email connot be empty.</p>')
    } else if(!emailValidation.test(req.body.email)) { // Email must be valid
        errors.push('<p>Email address is invalid.</p>')
    }

    // If there are errors it sets the message to be sent.
    if(errors.length > 0) {
        req.session.message = {err: true, msg: `<h3>Oops...</h3>${errors.join('')}`}
    } else {
        // Params for mailchimp api
        const data = {
            members: [
                {
                    email_address: req.body.email,
                    merge_fields: 
                        {
                            FNAME: req.body.name.split(' ')[0],
                            LNAME: req.body.name.split(' ')[1]
                        },
                    status: 'subscribed'
                }
            ],
            // update_existing: true
        }
        // Mailchimp api post
        const submit = await req.mailChimp(data, `${process.env.MAILCHIMP_API_URL}/lists/${process.env.MAILCHIMP_AUDIENCE_ID}`)
        
        if(submit.ok) { // If mailchimp response is good it sets the message for the user
            req.session.message = {err: false, msg: `<p>Hello ${req.body.name.split(' ')[0]}!</p>
                <p>You have been signed up to receive updates and should recieve an email shortly to confirm.</p>`}
        } else { // If mailchimp sends error it sets that for the user.
            req.session.message = {err: true, msg: submit.resp[0].error_code == 'ERROR_CONTACT_EXISTS' ? 'Email address already added. Please use a different one.' : 'Error signing you up. Please try again.'}
            console.log(submit.resp)
        }
    }

    
    res.redirect('/#myAlert') // All responses will end with an alert box.
})

router.post('/contact', async (req, res) => {
    req.session.message = {err: false, msg: '<p>Form Submitted!</p>'}
    res.redirect('/contact#myAlert')
})

module.exports = router