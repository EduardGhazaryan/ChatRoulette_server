const express = require("express");
const http = require("http");
const dotenv = require("dotenv").config();
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const uuid = require("uuid");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const cron = require("node-cron");
const ffmpeg = require('fluent-ffmpeg');
const streamifier = require("streamifier");
const ejs=require("ejs")


const CorsOptions = require("./Config/CorsOptions.js");
const Connection = require("./Utils/Connection.js");

const AuthRouter = require("./Router/AuthRouter.js");
const UserRouter = require("./Router/UserRouter.js");
const User = require("./Model/User.js");
const OnlineUsers = require("./Model/OnlineUsers.js");
const moment = require('moment-timezone');


const app = express();
Connection();
const server = http.createServer(app);
app.set("view engine", "ejs")
app.set("views",path.join(__dirname, "views"))
app.use(cors(CorsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});
app.get("/",async(req,res)=>{
  res.render("index")
})

app.get("/document",async(req,res)=>{
  res.render("document")
})
app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.post("/api/mail", async (req, res) => {
  try {
    const { from, text } = req.body;
    const language = req.headers["accept-language"];

    if (from && text) {
      const mailOptions = {
        from: process.env.EMAIL,
        to: "limit01.am@gmail.com",
        subject: from,
        text: text,
      };

      await transporter.sendMail(mailOptions);

      if (language) {
        if (language === "am") {
          res
            .status(201)
            .send({
              message:
                "Ձեր նամակը հաջողությամ ուղարկվել է ձեզ հետ կապ կհաստատեն նշված էլէկտրոնային հասցեով",
              success: true,
            });
        }
        if (language === "ru") {
          res
            .status(201)
            .send({
              message:
                "Ваше электронное письмо было успешно отправлено, и с вами свяжутся по указанному адресу электронной 	`					почты.",
              success: true,
            });
        }
        if (language === "en") {
          res
            .status(201)
            .send({
              message:
                "Your email has been successfully sent, and you will be contacted at the email address you 								provided.",
              success: true,
            });
        }
      } else {
        res
          .status(201)
          .send({
            message:
              "Your email has been successfully sent, and you will be contacted at the email address you 								provided.",
            success: true,
          });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//-----------------------Firebase start----------------
let tokens = [];
const users = {};
let room_ended = [];
let newRoomConnect = [];
let userCount = [];


const getCurrentDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based, so we add 1
  const year = today.getFullYear();

  return `${day}/${month}/${year}`;
};

app.post("/api/save-token", async (req, res) => {
  try {
    const { token, phoneID } = req.body;

    if (token && phoneID) {
      const findUser = await User.findOne({ phoneID });
      if (findUser) {
        findUser.firebaseToken = token;
        await findUser.save();
        tokens.push(token);

        res.sendStatus(201);
      } else {
        res.sendStatus(404);
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});



const serviceAccount = require("./chatandroid-f0d79-firebase-adminsdk-6y56u-2ec65e2101.json");
const Chats = require("./Model/Chats.js");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendPushNotification = async (user) => {
  const token = user.firebaseToken;
  
  if (!token) {
    console.log(`User ${user._id} does not have a firebase token`);
    return;
  }

  console.log("Sending notification to:", token);

  const message = {
    notification: {
      title: "Special Offer",
      body: "Try your Luck",
    },
    token: token,
    data: {},
    apns: {
      headers: {
        'apns-priority': '10',
        'apns-push-type': 'alert'
      },
      payload: {
        aps: {
          alert: {
            title: "Special Offer",
            body: "Try your Luck",
          },
          sound: 'default'
        }
      }
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    console.error("Error sending message:", error);

    // Check for the specific error regarding invalid registration tokens
    if (error.errorInfo && error.errorInfo.code === 'messaging/registration-token-not-registered') {
      console.log(`Removing invalid token for user ${user._id}`);
      try {
        // Remove or invalidate the token in the database
        await User.updateOne({ _id: user._id }, { $unset: { firebaseToken: 1 } });
        console.log(`Token removed for user ${user._id}`);
      } catch (dbError) {
        console.error(`Error updating database for user ${user._id}:`, dbError);
      }
    }
  }
};

// cron.schedule('*/5 * * * *', async () => {
//   const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//   try {
//     const inactiveUsers = await User.find({
//       lastLogin: { $lt: twentyFourHoursAgo },
//     });
    
//     console.log("crone---",inactiveUsers);
//     inactiveUsers.forEach((user) => {
//       sendPushNotification(user);
//     });

//   } catch (error) {
//     console.error("Error fetching users:", error);
//   }
// });



cron.schedule('*/1 * * * *', async () => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set the time to the start of the day

  try {
    const inactiveUsers = await User.find({
      lastLogin: { $lt: twentyFourHoursAgo },
      $or: [
        { lastNotificationSent: { $exists: false } }, 
        { lastNotificationSent: { $lt: today } } 
      ]
    });
    
    console.log("cron---", inactiveUsers);
    inactiveUsers.forEach(async (user) => {
      await sendPushNotification(user); 
      user.lastNotificationSent = new Date(); 
      await user.save(); 
    });

  } catch (error) {
    console.error("Error fetching users:", error);
  }
});







//-----------------------Firebase end----------------

// ---------------------voice start

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, uuid.v4() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Ensure the uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ------------------------voice end

function getRandomRoomName(length = 10) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let roomName = "";

  for (let i = 0; i < length; i++) {
    roomName += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return roomName;
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000000);
  return `id-${timestamp}-${randomNum}`;
}




const io = require("socket.io")(server, {
  pingInterval: 25000, 
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e7
});
console.log("1");

io.on("connection", (socket) => {
  if (!users[socket.id]) {
    users[socket.id] = socket.id;
  }

  let intervalUsers = []
  socket.emit("me", socket.id);

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("hey", {
      from: data.from,
      roomId: data.roomId,
    });
  });


  socket.on("disconnect", async ()=>{
    console.log("socket was disconnected--------",socket.id);
    const findNewRoomConnect =  newRoomConnect?.find((r)=> r.roomMembers.includes(socket.id))
    const findRoomeEnded = room_ended?.find((r)=> r.roomId === findNewRoomConnect?.roomId)
    const participantID = findNewRoomConnect?.roomMembers?.find((u)=> u !== socket.id)
    userCount = userCount.filter((u) => u.socketID !== socket.id);
    const findUser = await OnlineUsers.findOne({socketID: socket.id})
    const findParticipant = await OnlineUsers.findOne({socketID: participantID})

    if(findUser && findParticipant){
      findUser.status = "offline"
      findParticipant.status = "offline"

      await findUser.save()
      await findParticipant.save()
    }

  

    if(findRoomeEnded){
      console.log("true----------",findRoomeEnded,findNewRoomConnect);
      room_ended.map((room)=>{
        if(room.roomId === findNewRoomConnect.roomId){
          room.endCount = room.endCount + 1
          room.notSaveCount = room.notSaveCount + 1
          return room
        }else{
          return room
        }
      })
      newRoomConnect.map((r)=>{
        if(r.roomId === findNewRoomConnect.roomId){
          r.endCount  = r.endCount + 1
          return r
        }else{
          return r
        }
      })

      if(findRoomeEnded.endCount === 2){
        console.log("endcount ===== 2--------------",findRoomeEnded);
        if(findRoomeEnded.notSaveCount === 2){
          		fs.unlink(`uploads/${findRoom.roomId}`, (err) => {
				        if (err) {
					        console.error("Error deleting the file:", err);
					        return;
				        }
				      });
        }

        room_ended = room_ended.filter((r)=> r.roomId !== findNewRoomConnect.roomId)
        newRoomConnect = newRoomConnect.filter((r)=> r.roomId !== findNewRoomConnect.roomId)

      }

      if(findRoomeEnded.endCount === 1){
        console.log("will--work--emit----=-----", findRoomeEnded);
        socket.to(participantID).emit("end_chat", {message:"Zrucakicy lqec chaty"})
      }
    }



  })

  



  socket.on("join", async (payload) => {
    let roomId = getRandomRoomName();
    

    userName_cookie = payload.socketID;

    const findChat = newRoomConnect.find(
      (chat) =>
        chat.roomMembers.includes(payload.socketID) &&
        chat.roomMembers.includes(payload.participant)
    );

    if (findChat) {
      roomId = findChat.roomId;
      socket.join(findChat.roomId);

      

      console.log("room_joined----", {
        roomId,
        socket: socket.id,
        user: payload.userId,
        participant: payload.participant,
      });

      const findOnlineUser = await OnlineUsers.findOne({
        user: payload.userId,
      });

      if (findOnlineUser) {
        findOnlineUser.status = "offline";
        await findOnlineUser.save();
      }

      socket.emit("room_joined", {
        roomId: findChat.roomId,
        peerId: socket.id,
        all_users: newRoomConnect,
      });
    } else {
      newRoomConnect.push({
        roomId,
        roomMembers: [payload.socketID, payload.participant],
        endCount : 0
      });

      room_ended.push({
        roomId: roomId,
        endCount: 0,
        saveCount: 0,
        notSaveCount: 0,
      });

      socket.join(roomId);

      console.log("room_created----", {
        roomId,
        socket: socket.id,
        user: payload.userId,
        participant: payload.participant,
      });
      socket.emit("room_created", {
        roomId: roomId,
        peerId: socket.id,
        all_users: newRoomConnect,
      });

      const findOnlineUser = await OnlineUsers.findOne({
        user: payload.userId,
      });

      if (findOnlineUser) {
        findOnlineUser.status = "offline";
        await findOnlineUser.save();
      }
    }



    socket.on("message", async (message) => {
      console.log("new-message----", message);
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      let messageTime = `${hours}:${minutes}:${seconds}`;

      let findRoom = newRoomConnect.find((r) => r.roomId === message.roomId);
      let findBySocketID = findRoom.roomMembers.find(
        (id) => id !== message.from
      );
      const findUser = await User.findOne({ socketID: findBySocketID });

      let findUserCount = userCount.find(
        (r) => r.roomId === message.roomId && r.socketID === findBySocketID
      );

      if (findUserCount) {
        if (findUserCount.chatBonus < 20) {
          userCount.map((r) => {
            if (r.roomId === message.roomId && r.socketID === findBySocketID) {
              r.chatBonus = r.chatBonus + 1;
              return r
            }else{
              return r
            }
          });
          findUser.bonus = findUser.bonus + 1;

          await findUser.save();
        }
      } else {
        userCount.push({
          socketID: findBySocketID,
          roomId: message.roomId,
          chatBonus: 1,
        });
        findUser.bonus = findUser.bonus + 1;
        await findUser.save();
      }

      let id = generateUniqueId();
      console.log("gnacox message-----");
      io.to(roomId).emit("createMessage", {
        ...message,
        messageID: id,
        messageTime,
      });
    });

    socket.on("image_upload", (data) => {
      const buffer = Buffer.from(data.image, "base64");
      console.log("image----", data);
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      let messageTime = `${hours}:${minutes}:${seconds}`;

      const imageSizeInBytes = Buffer.byteLength(buffer);
  

  const imageSizeInMB = (imageSizeInBytes / (1024 * 1024)).toFixed(2);

  console.log(`Image size: ${imageSizeInMB} MB`);
  console.log(`Image size: ${imageSizeInBytes} MB`);

      let id = generateUniqueId();

	  const folderPath = path.join(__dirname, "uploads", roomId);
      const fileName = `${Date.now()}.jpg`;
      const filePath = path.join(folderPath, fileName);

	  if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath, { recursive: true });
	  }

      fs.writeFile(filePath, buffer, (err) => {
        if (err) {
          console.error(err);
        } else {
        }
      });
      const imageUrl = `uploads/${roomId}/${fileName}`;

      io.to(roomId).emit("receive_image", {
        imageUrl,
        userId: data.userId,
        socketID: data.socketID,
        messageTime,
        messageID: id,
      });
    });

    
    socket.on("end_chat", async (info) => {
      let findRoom = newRoomConnect?.find((r) => r.roomId === info.roomId);
      let participantID = findRoom?.roomMembers?.find(
        (u) => u !== info.socketID
      );

      console.log("end_chat--is worked--------",{roomId: info.roomId, user: info.socketID,findRoom,participantID});
      
      const findOnlineUser = await OnlineUsers.findOne({ user: info.userId });

      if (findOnlineUser) {
        findOnlineUser.status = "offline";
        await findOnlineUser.save();
      }

      userCount = userCount.filter(
        (u) => u.roomId !== info.roomId && u.socketID !== info.socketID
      );
      newRoomConnect.map((r)=>{
        if(r.roomId === info.roomId){
          r.endCount  = r.endCount + 1
          return r
        }else{
          return r
        }
      })
      if(findRoom && findRoom.endCount === 1){
        
        socket
        .to(participantID)
        .emit("end_chat", { message: "Zrucakicy lqec chaty" });
        console.log("newRoomConnect---------changed--------",newRoomConnect);
      }
     
      if(findRoom.endCount > 1){
        newRoomConnect = newRoomConnect.filter((r) => r.roomId !== info.roomId);
      }

      


       



        
        // interval = setTimeout(() => {
        //   let findEnded = room_ended.find((r) => r.roomId === info.roomId);
        //   if (findEnded) {
        //     if(findEnded.endCount !== 2){
        //       room_ended.map((el)=>{
        //         if(el.roomId === info.roomId){
        //           el.notSaveCount += 1
        //           el.endCount += 1

        //           if(el.notSaveCount === 2){
        //             fs.rm(`uploads/${el.roomId}`, { recursive: true, force: true }, (err) => {
        //               if (err) {
        //                 console.error("Error deleting the folder:", err);
        //                 return;
        //               }
        //               console.log("Folder successfully deleted.");
        //             })

                   
                    
        //           }

        //           return el

        //         }else{
        //           return el
        //         }
        //       })

        //       let newFindEnded = room_ended.find((r) => r.roomId === info.roomId);
        //       if(newFindEnded.endCount === 2){
        //         room_ended = room_ended.filter((r) => r.roomId !== info.roomId);
        //       }

        //       socket.emit("endTimeOut", {message: "timeout is ended", end:true})
        //     } 
        //   }else{
        //     room_ended.push({
        //       roomId: info.roomId,
        //       endCount: 1,
        //       saveCount: 0,
        //       notSaveCount: 1,
        //     });

        //     socket.emit("endTimeOut", {message: "timeout is ended", end:true})
        //   }
        // }, 60000);

      intervalUsers.push(
        {
          userId : info.userId, 
          roomId: info.roomId, 
          interval: setTimeout(() => {
            console.log("will-work-timeout---------", info.socketID);
            io.to(info.socketID).emit("closetime",{message:`Pahne Ekel ${info.socketID}-----${info.userId}`})
            
          }, 20000) 
        }
      )
      
      socket.removeAllListeners("message");
      socket.removeAllListeners("image_upload");
      socket.removeAllListeners("sendVoiceMessage");
      socket.removeAllListeners("end_chat");

      
    });

    // socket.on("sendVoiceMessage", (data) => {
    //   const voiceBlob = Buffer.from(new Uint8Array(data.voiceBlob));

    //   const now = new Date();
    //   const hours = now.getHours().toString().padStart(2, "0");
    //   const minutes = now.getMinutes().toString().padStart(2, "0");
    //   const seconds = now.getSeconds().toString().padStart(2, "0");
    //   let messageTime = `${hours}:${minutes}:${seconds}`;

    //   let id = generateUniqueId();

    //   // Save the voice message to the server
	  // const folderPath = path.join(__dirname, "uploads", data.roomId);
    //   const filename = `${uuidv4()}.webm`;
    //   const filePath = path.join(folderPath, filename);
	  // if (!fs.existsSync(folderPath)) {
		// fs.mkdirSync(folderPath, { recursive: true });
	  // }
    //   fs.writeFile(filePath, voiceBlob, (err) => {
    //     if (err) {
    //       console.error("Error saving voice message:", err);
    //       return;
    //     }

    //     // Broadcast the file path to other users in the room
    //     io.to(data.roomId).emit("receiveVoiceMessage", {
    //       socketID: data.socketID,
    //       userId: data.userId,
    //       voiceUrl: `uploads/${data.roomId}/${filename}`,
    //       messageID: id,
    //       messageTime,
    //     });
    //   });
    // });


    socket.on("sendVoiceMessage", (data) => {
      const voiceBlob = Buffer.from(new Uint8Array(data.voiceBlob));
   
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      let messageTime = `${hours}:${minutes}:${seconds}`;
   
      let id = generateUniqueId();
   
      const folderPath = path.join(__dirname, "uploads", data.roomId);
      const originalFilename = `${uuidv4()}.webm`;
      const originalFilePath = path.join(folderPath, originalFilename);
      const convertedFilename = `${uuidv4()}.aac`;
      const convertedFilePath = path.join(folderPath, convertedFilename);
   
      if (!fs.existsSync(folderPath)) {
         fs.mkdirSync(folderPath, { recursive: true });
      }
   
      // Save the WebM file temporarily
      fs.writeFile(originalFilePath, voiceBlob, (err) => {
         if (err) {
            console.error("Error saving voice message:", err);
            return;
         }
   
         // Convert WebM to AAC format
         ffmpeg(originalFilePath)
   .toFormat('mp3')
   .on('error', (err) => {
      console.error('Error converting voice message:', err);
   })
   .on('end', () => {
      // Broadcast the converted file path to other users in the room
      io.to(data.roomId).emit("receiveVoiceMessage", {
         socketID: data.socketID,
         userId: data.userId,
         voiceUrl: `uploads/${data.roomId}/${convertedFilename}`,
         messageID: id,
         messageTime,
      });
      
      fs.unlink(originalFilePath, (err) => {
         if (err) console.error('Error deleting WebM file:', err);
      });
   })
   .save(convertedFilePath);

      });
   });

    socket.on("isSaved",async (info)=>{
      let findEnded = room_ended.find((r) => r.roomId === info.roomId);
      console.log("isSaved-------",info);
      intervalUsers.map((u)=>{
        if(u.userId === info.userId && u.roomId === info.roomId){
          clearTimeout(u.interval)
          return u
        }else{
          return u
        }
      })

      console.log("intervalUsers---------",intervalUsers);
      intervalUsers = intervalUsers.filter((u)=> u.userId !== info.userId )
      console.log("intervalUsers---------delete------",intervalUsers);

      const user = await User.findById(info.userId);




      if(findEnded){
        room_ended.map((el) => {
          if (el.roomId === info.roomId) {
            if(info.save){
              el.saveCount += 1;
              el.endCount += 1;
              return el
            }else{
              el.notSaveCount += 1;
              el.endCount += 1;
              return el
            }
          }else{
            return el
          }
        });
      }else{
        room_ended.push({
          roomId: info.roomId,
          endCount: 1,
          saveCount: info.save ? 1 : 0,
          notSaveCount: info.save ? 0 : 1,
        });

      }


      if(info.save){

        console.log("isSvaed------------true------",info);

        let messageText = info.language === "am" ? "Նամակագրություն" : info.language === "ru" ? "Переписка" : "Chat";
			  const createdAt = getCurrentDate();
			  const newChat = new Chats({
			      userId : info.userId,
			      roomId: info.roomId,
			      participantId : info.participantId,
			      createdAt,
			      chatName: `${messageText}/${createdAt}`,
			      chat: info.chat
			  });
	
			await newChat.save();
	
    
			user.chats = [...user.chats, newChat._id];
			await user.save();

      let findEnd = room_ended.find((r) => r.roomId === info.roomId);

      if(findEnd.endCount === 2){
        room_ended = room_ended.filter((r) => r.roomId !== info.roomId);
      }

      }else{
        let findEnd = room_ended.find((r) => r.roomId === info.roomId);

        if(findEnd.endCount === 2){
          if(findEnd.notSaveCount === 2){
          
            fs.rm(`uploads/${findEnd.roomId}`, { recursive: true, force: true }, (err) => {
              if (err) {
                console.error("Error deleting the folder:", err);
                return;
              }
              console.log("Folder successfully deleted.");
            });
           
          }

          room_ended = room_ended.filter((r) => r.roomId !== info.roomId);
        }

       
      }






      
    })


    socket.on("onFocus", (data) => {
      const findRoom = newRoomConnect.find(r=> r.roomId === data.roomId)
	    const participant = findRoom?.roomMembers?.find(r=> r !== data.socketID)
      console.log("onFocus----participant", participant);
      console.log("onFocus----data.socketID", data.socketID);
      socket.to(participant).emit("onTyping", { isTyping: true});

    })

    socket.on("onBlur", (data) => {
      const findRoom = newRoomConnect.find(r=> r.roomId === data.roomId)
      const participant = findRoom?.roomMembers?.find(r=> r !== data.socketID)
      console.log("onBlur----participant", participant);
      console.log("onBlur----data.socketID", data.socketID);
      socket.to(participant).emit("onTyping", { isTyping: false});
    })


  });
});



app.get("/api/uploads/:roomId/:image", (req, res) => {
	try {
	  const roomId = req.params.roomId;
	  const image = req.params.image;
	  const imagePath = path.join(__dirname, "uploads", roomId, image);
  
	  if (fs.existsSync(imagePath)) {
		res.sendFile(imagePath);
	  } else {
		res.status(404).send("Image not found");
	  }
	} catch (error) {
	  console.error("Error fetching the image:", error);
	  res.status(500).send("Server error");
	}
  });
  app.get("/logo", (req, res) => {
    try {
      const roomId = req.params.roomId;
      const image = req.params.image;
      const imagePath = path.join(__dirname, "views", "images", "logo.png");
    
      if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
      } else {
      res.status(404).send("Image not found");
      }
    } catch (error) {
      console.error("Error fetching the image:", error);
      res.status(500).send("Server error");
    }
    });

const PORT = process.env.PORT || 2000;






server.listen(PORT, () => console.log(`server is running on ${PORT}`));
