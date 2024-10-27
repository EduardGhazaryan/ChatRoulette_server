const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        nickname: { type: String, required: true },
        socketID : {type: String, required:true},
        age: { type: Number, required: true },
        gender: { type: String, enum: ["male", "female"] },
        status: { type: String, default: "online" },
        premium: { type: Boolean, default: false },
        chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chats" }],
        bonus : {type:Number, default:0},
        phoneID: {type:String,required:true},
        access_token: {type:String, required:true},
        lastLogin: {type:Date},
        lastNotificationSent: { type: Date, default: null },
        firebaseToken: {type: String, default:null}
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
