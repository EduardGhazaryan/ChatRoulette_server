const express = require('express');
const UserController = require('../Controller/UserController.js');


const UserRouter = express.Router();

UserRouter.get("/notification", UserController.getNotification)

UserRouter.get('/search/:id', UserController.search);

UserRouter.get('/largeSearch/:id', UserController.largeSearch);

UserRouter.get("/:id", UserController.getUser)

UserRouter.get("/getChats/:id", UserController.getUserChat)

UserRouter.put("/changeBonus",UserController.changeBonus)

UserRouter.put("/changePremium", UserController.changePremium)

UserRouter.post("/stopSearch", UserController.stopSearch)

UserRouter.post("/complain", UserController.complain)

UserRouter.put("/changeUser", UserController.changeUser)

UserRouter.put("/chat/:id", UserController.changeChat)

UserRouter.delete("/chat/:id", UserController.deleteChat)

UserRouter.delete("/delete/:id", UserController.deleteUser)


module.exports = UserRouter;
