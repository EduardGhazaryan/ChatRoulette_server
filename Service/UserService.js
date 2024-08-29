const Chats = require("../Model/Chats.js");
const OnlineUsers  = require("../Model/OnlineUsers.js");
const User = require("../Model/User.js");



const UserService = {
    search: async (gender, maxAge, minAge,userId,socketID,language)=>{
        let newUser = null
       
        if(userId,socketID){
            let findOnline = await OnlineUsers.findOne({user:userId}).populate(['user'])

            if(findOnline){
                 findOnline.searchParams.gender = gender
                 findOnline.searchParams.maxAge = maxAge
                 findOnline.searchParams.minAge = minAge
                 findOnline.status = "online"
                 findOnline.socketID = socketID
     
                 await findOnline.save()
                 newUser = findOnline
            }else{
             const newOnlineUser =  new OnlineUsers({
                 user: userId,
                 status: "online",
                 socketID,
                 searchParams : {
                     gender,
                     maxAge,
                     minAge,
                    
                 }
     
             })
     
             await newOnlineUser.save()
             newUser = newOnlineUser
            }
     
             const  allUsers = await OnlineUsers.find({ user: { $ne: userId } }).populate(["user"])
     
             const user = await User.findById(userId)
             
             const onlineUsers = allUsers.filter((u)=> u.status === "online" && u.user !== userId)
                
                
     
             if(onlineUsers.length > 0){
                
     
                 if(!gender && !maxAge && !minAge){
                     let findUser = onlineUsers.filter((u)=> {
                         if(u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             return u
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.gender === user.gender){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.gender === user.gender){
                                 return u
                             }
                         }
                       
     
                     })
                     let index = Math.floor(Math.random() * findUser.length)
                     
                     return {status:200, user: onlineUsers[index],success:true}
                 }
                 if(gender && !maxAge && !minAge){
                     
                     const findUserGender = onlineUsers.filter((u)=> {
                         if(u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender && gender === u.user.gender){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if(gender === u.user.gender){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && gender === u.user.gender){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && gender === u.user.gender && gender === u.user.gender){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.gender === user.gender && gender === u.user.gender){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && gender === u.user.gender){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender && gender === u.user.gender){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.gender === user.gender && gender === u.user.gender){
                                 return u
                             }
                         }
                     } )
                     let index = Math.floor(Math.random() * findUserGender.length)
                   
                     if(findUserGender.length > 0){
                         return {status: 200, user:findUserGender[index], success:true}
                     }else{
     
                         if(language){
                             if(language ==="am"){
                                 return{status: 200, message: "Տվյալ պարամետրերով օգտատեր չի գտնվել", success:false}
                             }
                             if(language ==="ru"){
                                 return{status: 200, message: "Мы не нашли ни одного пользователя с этими параметрами", success:false}
                             }
                             if(language ==="en"){
                                 return{status: 200, message: "We didn't find any User With These parameters", success:false}
                             }
             
                         }else{
                             return{status: 200, message: "We didn't find any User With These parameters",success:false}
                         }
                         
                     }
                    
                  
                 }
                 if(!gender && maxAge && !minAge){
                
                     const findUserMax = onlineUsers.filter((u)=> {
                         if(u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender && maxAge >= u.user.gender){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if(maxAge >= u.user.gender){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && maxAge >= u.user.gender){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && maxAge >= u.user.gender){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.gender === user.gender && maxAge >= u.user.gender){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && maxAge >= u.user.gender){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender && maxAge >= u.user.gender){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.gender === user.gender && maxAge >= u.user.gender){
                                 return u
                             }
                         }
                     })
                     let index = Math.floor(Math.random() * findUserMax.length)
                     if(findUserMax.length > 0){
                         return {status: 200, user:findUserMax[index], success:true}
                     }else{
                         if(language){
                             if(language ==="am"){
                                 return{status: 200, message: "Տվյալ պարամետրերով օգտատեր չի գտնվել", success:false}
                             }
                             if(language ==="ru"){
                                 return{status: 200, message: "Мы не нашли ни одного пользователя с этими параметрами", success:false}
                             }
                             if(language ==="en"){
                                 return{status: 200, message: "We didn't find any User With These parameters", success:false}
                             }
             
                         }else{
                             return{status: 200, message: "We didn't find any User With These parameters",success:false}
                         }
                     }
                    
                    
                 
                 }
                 if(!gender && !maxAge && minAge){
           
                     const findUserMin = onlineUsers.filter((u)=>{
                         if(u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender && minAge >= u.user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if( minAge >= u.user.age){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && minAge >= u.user.age){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && minAge >= u.user.age){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.gender === user.gender && minAge >= u.user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && minAge >= u.user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender && minAge >= u.user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.gender === user.gender && minAge >= u.user.age){
                                 return u
                             }
                         }
                     } )
                     let index = Math.floor(Math.random() * findUserMin.length)
                     if(findUserMin.length > 0){
                         return {status: 200, user:findUserMin[index],success:true}
                     }else{
                         if(language){
                             if(language ==="am"){
                                 return{status: 200, message: "Տվյալ պարամետրերով օգտատեր չի գտնվել", success:false}
                             }
                             if(language ==="ru"){
                                 return{status: 200, message: "Мы не нашли ни одного пользователя с этими параметрами", success:false}
                             }
                             if(language ==="en"){
                                 return{status: 200, message: "We didn't find any User With These parameters", success:false}
                             }
             
                         }else{
                             return{status: 200, message: "We didn't find any User With These parameters",success:false}
                         }
                     }
                   
                    
                 }
                 if(gender && maxAge && !minAge){
                     const findUseGenderMax = onlineUsers.filter((u)=> {
                         if(u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender && gender === u.user.gender && maxAge >= u.user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if(gender === u.user.gender && maxAge >= u.user.age){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && gender === u.user.gender && maxAge >= u.user.age){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.gender === user.gender && gender === u.user.gender && maxAge >= u.user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && gender === u.user.gender && maxAge >= u.user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender && gender === u.user.gender && maxAge >= u.user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.gender === user.gender && gender === u.user.gender && maxAge >= u.user.age){
                                 return u
                             }
                         }
                     })
                     let index = Math.floor(Math.random() * findUseGenderMax.length)
                     if(findUseGenderMax.length > 0){
                         return {status: 200, user:findUseGenderMax[index], success:true}
                     }else{
                         if(language){
                             if(language ==="am"){
                                 return{status: 200, message: "Տվյալ պարամետրերով օգտատեր չի գտնվել", success:false}
                             }
                             if(language ==="ru"){
                                 return{status: 200, message: "Мы не нашли ни одного пользователя с этими параметрами", success:false}
                             }
                             if(language ==="en"){
                                 return{status: 200, message: "We didn't find any User With These parameters", success:false}
                             }
             
                         }else{
                             return{status: 200, message: "We didn't find any User With These parameters",success:false}
                         }
                     }
                 
                
                 }
                 if(gender && !maxAge && minAge){
                     const findUseGenderMin = onlineUsers.filter((u)=> {
                         if(u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender && gender === u.user.gender && minAge <= u.user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if( gender === u.user.gender && minAge <= u.user.age){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && gender === u.user.gender && minAge <= u.user.age){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && gender === u.user.gender && minAge <= u.user.age){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.gender === user.gender && gender === u.user.gender && minAge <= u.user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && gender === u.user.gender && minAge <= u.user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender && gender === u.user.gender && minAge <= u.user.age){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.gender === user.gender && gender === u.user.gender && minAge <= u.user.age){
                                 return u
                             }
                         }
                     })
                     let index = Math.floor(Math.random() * findUseGenderMin.length)
                     if(findUseGenderMin.length > 0){
                         return {status: 200, user:findUseGenderMin[index], success:true}
                     }else{
                         if(language){
                             if(language ==="am"){
                                 return{status: 200, message: "Տվյալ պարամետրերով օգտատեր չի գտնվել", success:false}
                             }
                             if(language ==="ru"){
                                 return{status: 200, message: "Мы не нашли ни одного пользователя с этими параметрами", success:false}
                             }
                             if(language ==="en"){
                                 return{status: 200, message: "We didn't find any User With These parameters", success:false}
                             }
             
                         }else{
                             return{status: 200, message: "We didn't find any User With These parameters",success:false}
                         }
                     }
                    
          
                 }
                 if(!gender && maxAge && minAge){
                     const findUseMaxMin = onlineUsers.filter((u)=> {
                         if(u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if( u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.gender === user.gender && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.gender === user.gender && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                       
                     })
                     let index = Math.floor(Math.random() * findUseMaxMin.length)
                     if(findUseMaxMin.length > 0){
                         return {status: 200, user:findUseMaxMin[index], success:true}
                     }else{
                         if(language){
                             if(language ==="am"){
                                 return{status: 200, message: "Տվյալ պարամետրերով օգտատեր չի գտնվել", success:false}
                             }
                             if(language ==="ru"){
                                 return{status: 200, message: "Мы не нашли ни одного пользователя с этими параметрами", success:false}
                             }
                             if(language ==="en"){
                                 return{status: 200, message: "We didn't find any User With These parameters", success:false}
                             }
             
                         }else{
                             return{status: 200, message: "We didn't find any User With These parameters",success:false}
                         }
                     }
                 
              
                 }
                 if(gender && maxAge && minAge){
                     const findUseGenderMaxMin = onlineUsers.filter((u)=> {
                         if(u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender  && u.user.gender === gender && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.user.gender === gender && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age  && u.user.gender === gender && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.maxAge >= user.age  && u.user.gender === gender && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.minAge <= user.age && u.searchParams.gender === user.gender  && u.user.gender === gender && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && !u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age  && u.user.gender === gender && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.maxAge >= user.age && u.searchParams.gender === user.gender  && u.user.gender === gender && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                         if(!u.searchParams.minAge && !u.searchParams.maxAge && u.searchParams.gender){
                             if(u.searchParams.gender === user.gender  && u.user.gender === gender && u.user.age <= maxAge && u.user.age >= minAge){
                                 return u
                             }
                         }
                     }) 
                     let index = Math.floor(Math.random() * findUseGenderMaxMin.length)
                     if(findUseGenderMaxMin.length > 0){
                         return {status: 200, user:findUseGenderMaxMin[index], success:true}
                     }else{
                         if(language){
                             if(language ==="am"){
                                 return{status: 200, message: "Տվյալ պարամետրերով օգտատեր չի գտնվել", success:false}
                             }
                             if(language ==="ru"){
                                 return{status: 200, message: "Мы не нашли ни одного пользователя с этими параметрами", success:false}
                             }
                             if(language ==="en"){
                                 return{status: 200, message: "We didn't find any User With These parameters", success:false}
                             }
             
                         }else{
                             return{status: 200, message: "We didn't find any User With These parameters",success:false}
                         }
                     }
                   
                 }
                 
               
                     
                 
               
             }else{
                
                 if(language){
                     if(language ==="am"){
                         
                         return {status: 200, message: "Տվյալ պահին օնլայն օգտատերեր չկան:", success: false}
                     }
                     if(language ==="ru"){
                         return {status: 200, message: "В настоящее время нет онлайн-пользователей.", success: false}
                     }
                     if(language ==="en"){
                         return {status: 200, message: "There are currently no online users", success: false}
                     }
     
                 }else{
                     return {status: 200, message: "There are currently no online users", success: false}
                 }
              
             }
        }else{
            return {status:400,message: "Bad Request"}
        }
    },
    getUser: async(userId,language)=>{
        if(userId){
            const findUser = await User.findById(userId).populate("chats")

            if(findUser){
                return {status:200, user:findUser, success:true}
            }else{
                if(language){
                    if(language === "am"){
                        return {status: 200, message: "Օգտատերը չի գտնվել", success:false}
                    }
                    if(language === "ru"){
                        return {status: 200, message: "Пользователь не найден", success:false}
                    }
                    if(language === "en"){
                        return {status: 200, message: "User Not Found", success:false}
                    }
                }else{
                    return {status: 200, message: "User Not Found", success:false}
                }
            }
        }else{
            return {status: 400, message:"Bad Request"}
        }
    },
    getNotification : async (language)=>{
        if(language){
            if(language === "am"){
                return {status:200 , message: "Փորձիր Քո Հաջողությունը", success:true}
            }
            if(language === "en"){
                return {status:200 , message: "Try Your Luck", success:true}
            }
            if(language === "ru"){
                return {status:200 , message: "Попробуй Свою Удачу", success:true}
            }
        }else{
            return {status: 400, message:"Bad Request", success:false}
        }
    },
    getUserChat : async (userId,language)=>{
        if(userId){
            const allChats = await Chats.find()
            const userChats = allChats.filter(c => c.userId === userId)

            if(userChats.length > 0){

                return {status:200, chats:userChats}                

            }else{
                if(language){
                    if(language === "am"){
                        return {status:200 , message: "Դուք չունեք պահպանված նամակագրություններ", success:false}
                    }
                    if(language === "en"){
                        return {status:200 , message: "You have no saved chats", success:false}
                    }
                    if(language === "ru"){
                        return {status:200 , message: "У вас нет сохраненной переписки", success:false}
                    }
                }else{
                    return {status: 400, message:"Bad Request", success:false}
                }
            }

        }else{
            return {status:400, message: "Bad Request"}
        }
    },
    changeUser : async (token,gender,age,language)=>{
       if(token){
        if(!gender && !age){
            return {status: 400, message : "Bad Request"}
        }else{
            const findUser = await User.findOne({access_token: token})

            if(findUser){
                age ? findUser.age = age : ""
                gender ? findUser.gender = gender : ""

                await findUser.save()

                return {status:202 ,user: findUser, success:true}


                
            }else{
                if(language){
                    if(language === "am"){
                        return {status: 200, message: "Օգտատերը չի գտնվել", success:false}
                    }
                    if(language === "ru"){
                        return {status: 200, message: "Пользователь не найден", success:false}
                    }
                    if(language === "en"){
                        return {status: 200, message: "User Not Found", success:false}
                    }
                }else{
                    return {status: 200, message: "User Not Found", success:false}
                }
            }
        }
       }else{
        return {status:400, message: "Bad Request You must send token"}
       }
    },
    addChat :async(roomId,chat,userId,language)=>{
        if(roomId,chat,userId){
            const user = await User.findById(userId)
            if(user){
                let messageText = language === "am" ? "Նամակագրություն" : language === "ru" ? "Переписка" : "Chat"
                const createdAt = new Date().toLocaleString()
                const newChat =  new Chats({
                    userId,
                    roomId,
                    createdAt,
                    chatName : `${messageText}/${createdAt}`,
                    chat
                 })

                await newChat.save()

                user.chats = [...user.chats,newChat._id]
                user.save()

                return {status:201,message:"Chat was added",success:true}
            }else{
                if(language){
                    if(language === "am"){
                        return {status: 200, message: "Օգտատերը չի գտնվել", success:false}
                    }
                    if(language === "ru"){
                        return {status: 200, message: "Пользователь не найден", success:false}
                    }
                    if(language === "en"){
                        return {status: 200, message: "User Not Found", success:false}
                    }
                }else{
                    return {status: 200, message: "User Not Found", success:false}
                }
            }



        }else{
            return {status:400, message:"Bad Request"}
        }
    },
    changeChat : async (chatId,newName,language)=>{
        if(chatId && newName){
            const findChat = await Chats.findById(chatId)

            if(findChat){
                findChat.chatName = newName
                await findChat.save()

                return {status: 202, chat: findChat, success:true}
            }else{

                if(language){
                    if(language === "am"){
                        return {status: 200, message: "Զրուցարան չի գտնվել", success:false}
                    }
                    if(language === "ru"){
                        return {status: 200, message: "Чат не найден", success:false}
                    }
                    if(language === "en"){
                        return {status: 200, message: "Chat Not Found", success:false}
                    }
                }else{
                    return {status: 404, message: "Chat Not Found", success:false}
                }
            }
        }else{
            return {status: 400 , message : "Bad Request"}
        }
    },
    changeBonus : async (token,bonus,language)=>{
        if(token && bonus){

            const findUser = await User.findOne({access_token: token})

            if(findUser){
                findUser.bonus = findUser.bonus  + bonus

                await findUser.save()

                return {status: 202, message: "Bonus was changed", user:findUser , success:true}
            }else{
                if(language){
                    if(language === "am"){
                        return {status: 200, message: "Օգտատերը չի գտնվել", success:false}
                    }
                    if(language === "ru"){
                        return {status: 200, message: "Пользователь не найден", success:false}
                    }
                    if(language === "en"){
                        return {status: 200, message: "User Not Found", success:false}
                    }
                }else{
                    return {status: 200, message: "User Not Found", success:false}
                }
            }
        }else{
            return {status: 400, message : "Bad Request"}
        }
    },
    stopSearch : async (userId,language)=>{
        if(userId){
            const user = await OnlineUsers.findOne({user:userId})
            if(user){

                user.status = "offline"

                await user.save()

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
                        return {status: 200, message: "Օգտատերը չի գտնվել", success:false}
                    }
                    if(language === "ru"){
                        return {status: 200, message: "Пользователь не найден", success:false}
                    }
                    if(language === "en"){
                        return {status: 200, message: "User Not Found", success:false}
                    }
                }else{
                    return {status: 200, message: "User Not Found", success:false}
                }
            }
           
        }else{
            return {status: 400, message : "Bad Request"}
        }
    }
};

module.exports = UserService;
