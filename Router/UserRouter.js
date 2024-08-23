const express = require('express');
const UserController = require('../Controller/UserController.js');


const UserRouter = express.Router();

UserRouter.get("/notification", UserController.getNotification)

UserRouter.get('/search/:id', UserController.search);

UserRouter.get("/:id", UserController.getUser)

UserRouter.put("/:id", UserController.changeUser)

UserRouter.post("/addChat", UserController.addChat)

UserRouter.post("/stopSearch", UserController.stopSearch)

UserRouter.put("/chat/:id", UserController.changeChat)

UserRouter.put("/changeBonus",UserController.changeBonus)

module.exports = UserRouter;
