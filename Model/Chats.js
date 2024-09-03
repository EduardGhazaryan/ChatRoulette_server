const mongoose = require('mongoose');

const ChatsSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        roomId: { type: String, required:true },
        createdAt: {type:String},
        chatName: {type:String},
        chat:  [{
                    userId: {type:String},
                    messageID: {type:String},
                    messageTime: {type:String},
                    content: {type:String},
                    imageUrl: {type:String},
                    voiceUrl : {type:String}
                }]
        
        
    },
    {
        timestamps: true
    }
);

const Chats = mongoose.model("Chats", ChatsSchema);

module.exports = Chats;
