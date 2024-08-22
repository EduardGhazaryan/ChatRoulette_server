const AuthService = require('../Service/AuthService');

const AuthController = {
    signUp: async (req, res) => {
        try {
            const { age, gender, nickname, socketID, phoneID } = req.body;
            const language =  req.headers["accept-language"] === "am" || req.headers["accept-language"] === "ru" || req.headers["accept-language"] === "en"  ? req.headers["accept-language"] : null
       
            
            const data = await AuthService.signUp(gender, age, nickname,socketID,phoneID,language);
            console.log("controll---",data);
            if (data.status > 300) {
                res.status(data.status).send({ message: data.message });
            } else {
                if(data.success){
                    res.status(data.status).send({ message: data.message , success:data.success, user: data.user , });
                }else{
                    res.status(data.status).send({ message: data.message , success:data.success});
                }
            }
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: "Internal Server Error" });
        }
    },
    signIn : async(req,res)=>{
        try {
            const {nickname, socketID,phoneID} = req.body

            const language = req.headers["accept-language"]

            const data = await AuthService.signIn(nickname,socketID,phoneID,language)

            if(data.status !== 201){
                res.status(data.status).send({ message: data.message });
            }else{
               if(data.success){
                res.status(data.status).send({ message: data.message, user: data.user, success:data.success });
               }else{
                res.status(data.status).send({ message: data.message, success:data.success});
               }
            }
            
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: "Internal Server Error" });
        }
    },
    signInToken :async (req,res)=>{
        try {
            const {socketID} = req.body
            const access_token = req?.headers?.authorization
            const token = access_token.split(" ")[1]

            const language = req.headers["accept-language"]

            console.log("token------",access_token);
            console.log("socketID------", socketID);
            console.log("language------",language);

            const data = await AuthService.signInToken(token,socketID,language)

            if(data.status === 201 || data.status === 200){
                if(data.success){
                    res.status(data.status).send({message: data.message, user : data.user, success :data.success})
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
    singOut : async (req,res)=>{
        try {
            const {userId} = req.body

            const language = req.headers["accept-language"]

            const data = await AuthService.signOut(userId,language)

        
            res.status(data.status).send({ message: data.message , success: data.success});
        
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: "Internal Server Error" });
        }
    }
};

module.exports = AuthController;
