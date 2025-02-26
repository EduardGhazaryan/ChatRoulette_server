const jwt = require("jsonwebtoken")

const isAuth = (req,res,next)=>{
    const access_token = req?.headers?.authorization
  
    try {
       if(access_token){
        const new_token = access_token.split(" ")[1]
        jwt.verify(new_token, process.env.ACCESS_TOKEN,(err,data)=>{
            if(err) return res.status(404).send({message : "Invalid Token"})
            req.user = data
            
            next()
        })
       }else{
        return res.status(400).send({message : "Token Not OK"})
       }
        
    } catch (error) {
        console.error(error)
        res.status(500).send({message : "Internal Server Error"})
    }
}

module.exports = isAuth