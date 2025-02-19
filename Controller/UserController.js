const OnlineUsers = require('../Model/OnlineUsers.js');
const UserService = require('../Service/UserService.js');

const UserController = {
    search: async (req, res) => {
        try {
            const { gender, maxAge, minAge, socketID , isLarge} = req.query;
            const { id } = req.params;
            const language = req.headers["accept-language"] ? req.headers["accept-language"] : null;
            console.log("searchController", req.query );
            const myMinAge = minAge ? minAge : null;
            const myMaxAge = maxAge ? maxAge : null;
            const myGender = gender ? gender : null;
            const mySocketID = socketID ? socketID : null;
            let isLargeBool = isLarge === "true"
    console.log("isLareg controller", isLargeBool);
            let data = await UserService.search(myGender, myMaxAge, myMinAge, id, mySocketID, language,isLargeBool);
            let count = 0;
            let interval;
    
            
            req.on('close', async () => {
                console.log('Request closed by the client');
                clearInterval(interval);  
    
                try {
                    const findUser = await OnlineUsers.findOne({ user: id });
                    if (findUser) {
                        findUser.status = "offline";
                        await findUser.save();
                    } else {
                        console.log("Invalid ID: User Not Found");
                    }
                } catch (error) {
                    console.error("Error updating user status:", error);
                }
            });
    
            if (data.status === 200) {
                interval = setInterval(async () => {
                    if (count === 20) {
                        if (!res.headersSent) {
                            console.log("interval will be over", { message: data.message, success: data.success , isLarge:data.isLarge});
                            res.status(200).send({ message: data.message, success: data.success , isLarge:data.isLarge});
                        }
                        clearInterval(interval);
                    } else {
                        if (data.success) {
                            if (!res.headersSent) {
                                console.log("find User in interval", { user: data.user, success: data.success, isLarge:data.isLarge });
                                res.status(data.status).send({ user: data.user, success: data.success, isLarge:data.isLarge });
                            }
                            clearInterval(interval);
                        } else {
                            let data2 = await UserService.search(myGender, myMaxAge, myMinAge, id, mySocketID, language,isLarge);
                            data = data2;
                            count++;
                        }
                    }
                }, 1000);
            } else {
                if (!res.headersSent) {
                    console.log("verjin log", data);
                    res.status(data.status).send({ message: data.message });
                }
            }
        } catch (error) {
            console.error(error);
            if (!res.headersSent) {
                res.status(500).send({ message: "Internal Server Error" });
            }
        }
    },  
    getUser: async(req,res)=>{
        try {

            const {id}  = req.params
            const language = req.headers["accept-language"]

            const data = await UserService.getUser(id,language)

            if(data.status === 200){
                if(data.success){
                    res.status(data.status).send({user:data.user,success:data.success})
                }else{
                    res.status(data.status).send({message:data.message,success:data.success})
                }
            }else{
                res.status(data.status).send({message:data.message})
            }
            
        } catch (error) {
            console.error(error)
            res.status(500).send({message: "Internal Server Error"})
        }
    },
    getNotification : async (req,res)=>{
        try {
            const language = req.headers["accept-language"]

            const data = await UserService.getNotification(language)

            res.status(data.status).send({message:data.message})
        } catch (error) {
            console.error(error)
            res.status(500).send({message: "Internal Server Error"})
        }
    },
    getUserChat: async (req,res)=>{
        try {
             const {id} = req.params
             const language = req.headers["accept-language"]

             console.log("getchat-id----",id);
             const data = await UserService.getUserChat(id,language)

             if(data.status < 300){
                if(data.success){
                    res.status(data.status).send({chats:data.chats, success:data.success})
                }else{
                    res.status(data.status).send({message:data.message, success:data.success})
                }
             }else{
                res.status(data.status).send({message:data.message})
             }


            
        } catch (error) {
            console.error(error)
            res.status(500).send({message: "Internal Server Error"})
        }
    },
    changeUser: async (req,res)=>{
        try {
            console.log(11);
            const {gender,age}= req.body
            const access_token = req?.headers?.authorization
            const token = access_token.split(" ")[1]
            const language = req.headers["accept-language"]

            const data = await UserService.changeUser(token,gender,age,language)

            if(data.status === 202 || data.status === 200){
                
                if(data.success){
                    res.status(data.status).send({user : data.user, success: data.success})
                }else{
                    res.status(data.status).send({message : data.message, success: data.success})
                }
            }else{
                res.status(data.status).send({message:data.message})
            }
        } catch (error) {
            console.error(error)
            res.status(500).send({message: "Internal Server Error"})
        }
    },
    complain : async (req,res)=>{
        try {
            const {userId,type} = req.body
            const access_token = req?.headers?.authorization
            const token = access_token.split(" ")[1]
            const language = req.headers["accept-language"]
            console.log("complain-----", userId,type);

            const data = await UserService.complain(token,userId,type,language)

  
            if(data.status < 400){
                res.status(data.status).send({success:data.success, message:data.message})
            
            }else{
                res.status(data.status).send({message:data.message})
            }


        } catch (error) {
            console.error(error)
            res.status(500).send({message: "Internal Server Error"})
        }
    },
    changeChat : async(req,res)=>{
        try {
            const {newName}= req.body
            const {id} = req.params
            const language = req.headers["accept-language"]

            const data = await UserService.changeChat(id,newName, language)

            

            if(data.status === 202 || data.status === 200){
                if(data.success){
                    res.status(data.status).send({chat : data.chat, success: data.success})
                }else{
                    res.status(data.status).send({message : data.message, success: data.success})
                }
            }else{
                res.status(data.status).send({message:data.message})
            }
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: "Internal Server Error" });
        }
    },
    changeBonus : async(req,res)=>{
        try {
            const {bonus} = req.body

            const access_token = req?.headers?.authorization
            const token = access_token.split(" ")[1]
            
            const language = req.headers["accept-language"]


            const data = await UserService.changeBonus(token,bonus,language)

            
            if(data.status === 202 || data.status === 200){
                if(data.success){
                    res.status(data.status).send({user : data.user, message:data.message ,success: data.success})
                }else{
                    res.status(data.status).send({message : data.message, success: data.success})
                }
            }else{
                res.status(data.status).send({message:data.message})
            }
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: "Internal Server Error" });
        }
    },
    changePremium : async(req,res)=>{
        try {
            const {id,state} = req.body
            
            const language = req.headers["accept-language"]

            const data = await UserService.changePremium(id,state,language)

            if(data.status < 400){
                if(data.success){
                    res.status(data.status).send({user : data.user, message:data.message ,success: data.success})
                }else{
                    res.status(data.status).send({message : data.message, success: data.success})
                }
            }else{
                res.status(data.status).send({message:data.message})
            }


        } catch (error) {
            console.error(error)
            res.status(500).send({message:"Internal Server Error"})
        }
    },
    stopSearch : async(req,res)=>{
        try {
            const {userId} = req.body
            const language = req.headers["accept-language"]

            const data = await UserService.stopSearch(userId,language)
            console.log("stop----", req.body);

            if(data.status < 400){
                res.status(data.status).send({message:data.message,success:data.success})
            }else{
                res.status(data.status).send({message:data.message})
            }

            

            
        } catch (error) {
            console.error(error)
            res.status(500).send({message:"Internal Server Error"})
        }
    },
    deleteChat : async(req,res)=>{
        try {
            const {id} = req.params

            const data = await UserService.deleteChat(id)

            if(data.status < 400){
                res.status(data.status).send({success:data.success, chat:data.chats})
            }else{
                res.status(data.status).send({message:data.message})
            }
            
        } catch (error) {
            console.error(error)
            res.status(500).send({message:"Internal Server Error"})
        }
    },
    deleteUser : async(req,res)=>{
        try {
            const {id} = req.params
            res.status(200).send({success:true})
            
        } catch (error) {
            console.error(error)
            res.status.send({message:"Internal Server Error"})
        }
    }

};

module.exports = UserController;
