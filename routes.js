const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
    const stories = await req.findMany('writing', 'stories', {})
    res.render('pages/index')
})

router.get('/blog', (req, res) => {
    res.render('pages/blog')
})

module.exports = router