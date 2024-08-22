const mongoose = require('mongoose');

const OnlineUsersSchema = new mongoose.Schema(
    {
        user : {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        socketID:  {type:String, required:true},
        status : {type:String, default:"offline"},
        searchParams : {
            gender : {type:String, default:null},
            maxAge : {type:Number, default:null},
            minAge : {type:Number, default:null},
        }
    },
    {
        timestamps:true,
    }
)

const OnlineUsers  = mongoose.model("OnlineUsers", OnlineUsersSchema)

module.exports = OnlineUsers;