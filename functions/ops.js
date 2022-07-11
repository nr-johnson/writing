const request = require('request')
var nodemailer = require('nodemailer');

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
        req.mailChimp = (data, dir, method) => {
            return new Promise(resolve => {                
                const mailOptions = {
                    url: dir,
                    method: method || "POST",
                    headers: {
                        Authorization: `auth ${process.env.MAILCHIMP_KEY}`
                    },
                    body: JSON.stringify(data)
                }
                request (mailOptions, (error, response, body) => {
                    const bodyData = JSON.parse(body)
                    if(error) {
                        console.log(error)
                        resolve({ok: false, resp: error})
                    } else if(bodyData.errors) {
                        if(bodyData.errors.length > 0) {
                            console.log(bodyData.errors)
                            resolve({ok: false, resp: bodyData.errors})
                        } else {
                            resolve({ok: true, resp: JSON.parse(response.body)})
                        }
                    } else {
                        resolve({ok: true, resp: JSON.parse(response.body)})
                    }
                })
            })
        }
        
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