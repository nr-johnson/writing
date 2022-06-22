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

module.exports = { dataOps }