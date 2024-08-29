const UserService = require('../Service/UserService.js');

const UserController = {
    search: async (req, res) => {
        try {
  
            const { gender, maxAge, minAge,socketID } = req.query;
            const {id} = req.params
            const language = req.headers["accept-language"]
   
            const myMinAge = minAge ? minAge : null
            const myMaxAge = maxAge ? maxAge : null
            const myGender = gender ? gender : null
            
       
        
            
            let data = await UserService.search(myGender,myMaxAge,myMinAge,id,socketID,language);
            let count = 0
           
            
            
            if(data.status === 200){
          
                let interval = setInterval(async () => {
                    if(count === 20){
                        res.status(200).send({message: data.message, success: data.success})
                        clearInterval(interval)
                    }else{
                        
                        if(data.success){
                            res.status(data.status).send({user:data.user, success:data.success})
                            clearInterval(interval)
                        }else{
                            let data2 = await UserService.search(myGender,myMaxAge,myMinAge,id,language);
                            data = data2
                            count++
                        }
                    }
                }, 1000);
                
            }else{
                res.status(data.status).send({ message: data.message });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: "Internal Server Error" });
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
             const {userId} = req.body
             const language = req.headers["accept-language"]

             const data = await UserService.getUserChat(userId,language)

             if(data.status < 400){
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
    addChat: async (req,res)=>{
        try {

            const {roomId,chat,userId} = req.body
            const language = req.headers["accept-language"]


            const data = await UserService.addChat(roomId,chat,userId, language)

            if(data.status === 400){
                res.status(data.status).send({message:data.message})
            }else{
                res.status(data.status).send({message:data.message, success:data.success})
            }
            
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: "Internal Server Error" });
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
    }
};

module.exports = UserController;
