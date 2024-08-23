const express = require('express');
const UserController = require('../Controller/UserController.js');


const UserRouter = express.Router();

UserRouter.get("/notification", UserController.getNotification)

UserRouter.get('/search/:id', UserController.search);

UserRouter.get("/:id", UserController.getUser)

UserRouter.put("/changeBonus",UserController.changeBonus)

UserRouter.post("/addChat", UserController.addChat)

UserRouter.post("/stopSearch", UserController.stopSearch)

UserRouter.put("/:id", UserController.changeUser)

UserRouter.put("/chat/:id", UserController.changeChat)


module.exports = UserRouter;
