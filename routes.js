const express = require('express')
const router = express.Router()

router.get('/', async (req, res, next) => {
    const stories = await req.findMany('writing', 'stories', {})
    res.render('index', {
        stories: stories
    })
})

module.exports = router