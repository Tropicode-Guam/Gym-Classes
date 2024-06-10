const mongoose = require('mongoose');

const classOrderSchema = new mongoose.Schema({
    ids: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true
    }
});

const ClassOrder = mongoose.model('ClassOrder', classOrderSchema);
module.exports = ClassOrder;