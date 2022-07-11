const request = require('request')
const nodemailer = require('nodemailer');
const chimp = require("mailchimp-marketing");

chimp.setConfig({
    apiKey: process.env.MAILCHIMP_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX,
});

function dataOps() {
    return (req, res, next) => {
        req.listCollections = (db, data) => {
            return new Promise(resolve => {
                data = data || {}
                resolve(req.mongo.db(db).listCollections(data).toArray())
            })
        }
        // Pulled from another app of mine. May not be needed.
        req.getRandom = (db, col, cond, count) => {
            return new Promise(resolve => {
                resolve(req.mongo.db(db).collection(col).aggregate([{$match: cond}, {$sample: {size: count}}]).toArray())
            })
        }
        // Pulled from another app of mine. May not be needed.
        req.findItem = (db, col, data, index) => {
            return new Promise(resolve => {
                if(index) resolve(req.mongo.db(db).collection(col).find(data).collation(index).limit(1).toArray())
                else resolve(req.mongo.db(db).collection(col).find(data).limit(1).toArray())
            })
        }
        req.findMany = (db, col, data) => {
            return new Promise(resolve => {
                data = data || {}
                resolve(req.mongo.db(db).collection(col).find(data).toArray())
            })
        }
        req.findCollection = (db, col, data) => {
            return new Promise(resolve => {
                data = data || {}
                resolve(req.mongo.db(db).collection(col).find(data).toArray())
            })
        }

        next()
    }
}

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



        // req.mailChimp = (data, dir, method) => {
        //     return new Promise(resolve => {
        //         // const checkOptions = {
        //         //     url: `${process.env.MAILCHIMP_API_URL}/lists/${process.env.MAILCHIMP_AUDIENCE_ID}/members/${data.members[0].email_address}`,
        //         //     method: 'GET',
        //         //     headers: {
        //         //         Authorization: `auth ${process.env.MAILCHIMP_KEY}`
        //         //     }
        //         // }
        //         // let status
        //         // request(checkOptions, (error, response, body) => {
        //         //     status = JSON.parse(body).status
        //         // })
        //         // status != 'subscribed' ? data.update_existing = true : null      
        //         console.log(data)
        //         const mailOptions = {
        //             url: dir,
        //             method: method || "POST",
        //             headers: {
        //                 Authorization: `auth ${process.env.MAILCHIMP_KEY}`
        //             },
        //             body: JSON.stringify(data)
        //         }
        //         request (mailOptions, (error, response, body) => {
        //             const bodyData = JSON.parse(body)
        //             if(error) {
        //                 console.log(error)
        //                 resolve({ok: false, resp: error})
        //             } else if(bodyData.errors) {
        //                 if(bodyData.errors.length > 0) {
        //                     console.log(bodyData.errors)
        //                     resolve({ok: false, resp: bodyData.errors})
        //                 } else {
        //                     resolve({ok: true, resp: JSON.parse(response.body)})
        //                 }
        //             } else {
        //                 resolve({ok: true, resp: JSON.parse(response.body)})
        //             }
        //         })
        //     })
        // }
        
        next()
    }
}

function emailOps() {
    return (req, res, next) => {
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

module.exports = { dataOps, siteOps, emailOps }