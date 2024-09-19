const express = require('express');
const UserController = require('../Controller/UserController.js');


const UserRouter = express.Router();

UserRouter.get("/notification", UserController.getNotification)

UserRouter.get('/search/:id', UserController.search);

UserRouter.get("/:id", UserController.getUser)

UserRouter.get("/getChats/:id", UserController.getUserChat)

UserRouter.put("/changeBonus",UserController.changeBonus)

// UserRouter.post("/addChat", UserController.addChat)

UserRouter.post("/stopSearch", UserController.stopSearch)

UserRouter.post("/complain", UserController.complain)

UserRouter.put("/changeUser", UserController.changeUser)

UserRouter.put("/chat/:id", UserController.changeChat)

UserRouter.delete("/chat/:id", UserController.deleteChat)


module.exports = UserRouter;
