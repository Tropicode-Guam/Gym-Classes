const DB_NAME = process.env["MONGO_INITDB_DATABASE"]

let db = db.getSiblingDB(DB_NAME)

// main api user
db.createUser({
    user: process.env['MONGO_INITDB_USER'],
    pwd: process.env['MONGO_INITDB_PASSWORD'],
    roles: [{
        role: 'readWrite',
        db: DB_NAME
    }]
})

// admin console user. just piggybacking mongo's user authentication 
// so we don't have to make our own
db.createUser({
    user: process.env['ADMIN_USER'],
    pwd: process.env['ADMIN_PASSWORD'],
    roles: []
})