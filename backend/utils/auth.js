const bcrypt = require("bcrypt")

const connection_hashes = {}

async function hash(username, password, expires_in_days) {
    const ms = expires_in_days*24*60*60*1000
    const expiry = new Date(new Date().getTime() + ms)
    const hash = await bcrypt.hash(username + '|' + password, 10)
    connection_hashes[hash] = expiry
    return hash
}

function authenticate(key) {
    if (connection_hashes[key]) {
        if (connection_hashes[key] - (new Date()) > 0) {
            return true
        } else {
            delete connection_hashes[key]
            return false
        }
    }
    return false
}

module.exports = {
    hash,
    authenticate
}