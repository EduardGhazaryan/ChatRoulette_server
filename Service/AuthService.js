const User = require('../Model/User.js');
const { generateAccessToken } = require('../Utils/GenerateToken.js');
const { DateTime } = require('luxon');




const getCurrentDateTime = () => {
    const currentTimeInArmenia = DateTime.now().setZone('Asia/Yerevan');    
    const formattedTime = currentTimeInArmenia.toUTC().toISO({ suppressMilliseconds: false });
    console.log("formatedDate--------",formattedTime);
    return formattedTime
};



const AuthService = {
    signUp: async (gender, age, nickname,socketID,phoneID,language,timezone) => {
       
        if (gender && age && nickname) {
            const findUser = await User.findOne({ nickname });
        
            
            if (findUser) {
                if(language){
                    if(language === "am"){
                        console.log("service---",language);
                        return { status: 200, message: "Տվյալ nickname-ով օգտատեր արդեն գոյություն ունի" , success: false};
                    }
                    if(language === "ru"){
                        return { status: 200, message: "Пользователь с данным ником уже существует" , success: false};
                    }
                    if(language === "en"){

                        return { status: 200, message: "User with this nickname already exists" , success: false};
                    }
                }else{
                    return { status: 200, message: "User with this nickname already exists" , success: false};
                    
                }
            } else {
                const userObj = {
                    age,
                    gender,
                    nickname,
                    socketID,
                    phoneID
                }
          
                const access_token = generateAccessToken(userObj);
                const loginTime = getCurrentDateTime();
                const newUser = new User({
                    age,
                    gender,
                    nickname,
                    socketID,
                    phoneID,
                    access_token,
                    lastLogin: loginTime 
                });


                await newUser.save();

            


                if(language){
                    if(language === "am"){
                        return { status: 201, message: "Դուք հաջողությամբ գրանցվել եք", success: true, access_token, user: newUser };
                    }
                    if(language === "ru"){
                        return { status: 201, message: "Вы успешно зарегистрировались", success: true, access_token, user: newUser };
                    }
                    if(language === "en"){

                        return { status: 201, message: "You have successfully registered", success: true, access_token, user: newUser };
                    }
                }else{
                    return { status: 201, message: "You have successfully registered", success: true, access_token, user: newUser };
                    
                }
            }
        } else {
            return { status: 400, message: "Bad Request" };
        }
    },
    signIn : async (nickname,socketID,phoneID,language,timezone)=>{
        if(nickname && socketID, phoneID){
            let findUser = await User.findOne({nickname})

            if(findUser){
                if(findUser.phoneID === phoneID){
                   
                        const loginTime = getCurrentDateTime();
                        findUser.status = "online"
                        findUser.socketID = socketID
                        findUser.lastLogin = loginTime
                       
                        await findUser.save()


                        if(language){
                            if(language === "am"){
                                return { status: 201, message: "Դուք հաջողությամբ մուտք եք գործել", user: findUser, success:true };
                            }
                            if(language === "ru"){
                                return { status: 201, message: "Вы успешно вошли в систему", user: findUser, success:true };
                            }
                            if(language === "en"){
        
                                return { status: 201, message: "You have successfully logged in", user: findUser, success:true };
                            }
                        }else{
                            return { status: 201, message: "You have successfully logged in", user: findUser, success:true };
                            
                        }
                    
    
               
                }else{
                    if(language){
                        if(language === "am"){
                            return  {status: 200, message: 'Հեռախոսի անվավեր ID' , success :false}
                        }
                        if(language === "ru"){
                            return  {status: 200, message: 'Неверный ID телефона' , success :false}
                        }
                        if(language === "en"){
    
                            return  {status: 200, message: 'Invalid phone ID' , success :false}
                        }
                    }else{
                        return  {status: 200, message: 'Invalid phone ID' , success :false}
                        
                    }
                }
            }else{
                if(language){
                    if(language === "am"){
                        return {status:200, message :"Օգտատերը չի գտնվել", success: false}
                    }
                    if(language === "ru"){
                        return {status:200, message :"Пользователь не найден", success: false}
                    }
                    if(language === "en"){

                        return {status:200, message :"User not found", success: false}
                    }
                }else{
                    return {status:200, message :"User not found", success: false}
                    
                }
            }
        }else{
            return {status:400, message :"Bad Request"}
        }
    },
    signInToken : async (token,socketID,language,timezone)=>{
        if(token){
            const findUser = await User.findOne({access_token :token})

            if(findUser){
                const loginTime = getCurrentDateTime();
                findUser.status = "online"
                findUser.socketID = socketID
                findUser.lastLogin = loginTime
                
                await findUser.save()

                if(language){
                    if(language === "am"){
                        return {status: 201, message: "Դուք հաջողությամբ մուտք եք գործել", user: findUser, success:true }
                    }
                    if(language === "ru"){
                        return {status: 201, message: "Вы успешно вошли в систему", user: findUser, success:true }
                    }
                    if(language === "en"){

                        return {status: 201, message: "You have successfully logged in", user: findUser, success:true }
                    }
                }else{
                    return {status: 201, message: "You have successfully logged in", user: findUser, success:true }
                    
                }
            }else{
                if(language){
                    if(language === "am"){
                        return {message: "Անվավեր Token", success:false, status: 200}
                    }
                    if(language === "ru"){
                        return {message: "Недействительный Token", success:false, status: 200}
                    }
                    if(language === "en"){
                        return {message: "Invalid Token", success:false, status: 200}
                    }
                }else{
                    return {message: "Invalid Token", success:false, status: 200}

                    
                }
            }
        }else{
            return {status: 400, message :"Bad Request"}
        }
    },
    signOut: async(userId,language)=>{
        if(userId){
            let findUser = await User.findById(userId)
    
            if(findUser){
                findUser.status = "offline"
                await  findUser.save()

                if(language){
                    if(language === "am"){
                        return { status: 201, message: 'Օգտատերը հաջողությամբ դուրս է եկել', success:true};
                    }
                    if(language === "ru"){
                        return { status: 201, message: 'Пользователь успешно вышел из системы',success:true};
                    }
                    if(language === "en"){

                        return { status: 201, message: 'User logged out successfully',success:true};
                    }
                }else{
                    return { status: 201, message: 'User logged out successfully',success:true};
                    
                }
            }else{
                if(language){
                    if(language === "am"){
                        return {status:200, message :"Օգտատերը չի գտնվել",success:false}
                    }
                    if(language === "ru"){
                        return {status:200, message :"Пользователь не найден",success:false}
                    }
                    if(language === "en"){
                        return {status:200, message :"User not found",success:false}
                    }
                }else{
                    return {status:200, message :"User not found",success:false}
                    
                }
            }
        }else{
            return {status:400, message :"Bad Request"}
        }
    }
};

module.exports = AuthService;
