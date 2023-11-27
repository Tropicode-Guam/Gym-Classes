const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    memberType: {
        type: String,
        enum: ['hotel', 'gym', 'insurance1', 'insurance2'],
        required: true
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;