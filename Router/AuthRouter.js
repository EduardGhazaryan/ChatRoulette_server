const express = require('express');
const AuthController = require('../Controller/AuthController.js');

const AuthRouter = express.Router();

AuthRouter.post("/signUp", AuthController.signUp);

AuthRouter.post("/signIn", AuthController.signIn)

AuthRouter.post("/signInToken", AuthController.signInToken)

AuthRouter.post('/signOut', AuthController.singOut)

module.exports = AuthRouter;
