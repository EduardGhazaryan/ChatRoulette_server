const mongoose = require('mongoose');

const Connection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB CONNECTED");
        return true;
    } catch (error) {
        console.error("DB Not Connected", error.message);
        return false;
    }
};

module.exports = Connection;