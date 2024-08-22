const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    const payload = {
        ...user
    };

    const access_token = jwt.sign(payload, process.env.ACCESS_TOKEN, {
        expiresIn: "120d"
    });

    return access_token;
};

module.exports = {
    generateAccessToken
};
