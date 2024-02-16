const mongoose = require('mongoose');

const signUpSchema = new mongoose.Schema({
    // 
    classID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phoneNum: {
        type: String,
        required: true
    },
    insuranceType: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    }
});

const SignUp = mongoose.model('SignUp', signUpSchema);
module.exports = SignUp;
