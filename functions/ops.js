const nodemailer = require('nodemailer');
const chimp = require("mailchimp-marketing");

// Sets MailChimp credentials
chimp.setConfig({
    apiKey: process.env.MAILCHIMP_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX,
});

// Functions that arent's related to MongoDB
function siteOps() {
    return (req, res, next) => {
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