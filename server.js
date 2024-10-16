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

const CorsOptions = require("./Config/CorsOptions.js");
const Connection = require("./Utils/Connection.js");

const AuthRouter = require("./Router/AuthRouter.js");
const UserRouter = require("./Router/UserRouter.js");
const User = require("./Model/User.js");
const OnlineUsers = require("./Model/OnlineUsers.js");

const app = express();
Connection();
const server = http.createServer(app);

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

app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.post("/api/mail", async (req, res) => {
  try {
    const { from, text } = req.body;
    const language = req.headers["accept-language"];

    if (from && text) {
      const mailOptions = {
        from: process.env.EMAIL,
        to: "webexprojects@gmail.com",
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
let intervalUsers = []

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

app.post("/api/user/addChat", async (req, res) => {
  try {
    const { roomId, chat, userId,participantId ,save } = req.body;
    const language = req.headers["accept-language"];

    if ((roomId, chat, userId)) {
      const user = await User.findById(userId);
      if (user) {
       
          findRoom = newRoomConnect.find((r) => r.roomId === roomId);
        //   let participantID = findRoom?.roomMembers?.find(
        //     (u) => u !== user.socketID
        //   );
          let findEnded = room_ended.find((r) => r.roomId === roomId);

          if (findEnded) {
            if (save === false) {
              let state = false;
              room_ended.map((el) => {
                if (el.roomId === roomId) {
                  el.endCount += 1;
                  el.notSaveCount += 1;
                  if (el.endCount === 2) {
                    // if (chat) {
                    // //   chat.map((el) => {
                    // //     if (el.imageUrl) {
                    // //       fs.unlink(`${el.imageUrl}`, (err) => {
                    // //         if (err) {
                    // //           console.error("Error deleting the file:", err);
                    // //           return;
                    // //         }
                    // //       });
                    // //     }
                    // //     if (el.voiceUrl) {
                    // //       fs.unlink(`${el.voiceUrl}`, (err) => {
                    // //         if (err) {
                    // //           console.error("Error deleting the file:", err);
                    // //           return;
                    // //         }
                    // //       });
                    // //     }
                    // //   });

					
                    // }

					fs.unlink(`uploads/${roomId}`, (err) => {
						if (err) {
						  console.error("Error deleting the file:", err);
						  return;
						}
					  });

                      state = true;
                  }

                  if (el.saveCount + el.notSaveCount === 2) {
                    state = true;
                  }
                }
              });

              if (state) {
                room_ended = room_ended.filter((r) => r.roomId !== roomId);
              }
            }
            if (save === true) {
              room_ended.map((el) => {
                if (el.roomId === roomId) {
                  el.saveCount += 1;
                }
              });


			  let messageText = language === "am" ? "Նամակագրություն" : language === "ru" ? "Переписка" : "Chat";
			  const createdAt = getCurrentDate();
			const newChat = new Chats({
			  userId,
			  roomId,
			  participantId : participantId,
			  createdAt,
			  chatName: `${messageText}/${createdAt}`,
			  chat,
			});
	
			await newChat.save();
	
			user.chats = [...user.chats, newChat._id];
			await user.save();






            }
          } else {
            room_ended.push({
              roomId: roomId,
              endCount: save === true ? 0 : 1,
              saveCount: save === true ? 1 : 0,
              notSaveCount: save === true ? 0 : 1,
            });


			if (save === true) {
				room_ended.map((el) => {
				  if (el.roomId === roomId) {
					el.saveCount += 1;
				  }
				});
  
  
				let messageText = language === "am" ? "Նամակագրություն" : language === "ru" ? "Переписка" : "Chat";
				const createdAt = getCurrentDate();
			  const newChat = new Chats({
				userId,
				roomId,
				participantId : participantId,
				createdAt,
				chatName: `${messageText}/${createdAt}`,
				chat,
			  });
	  
			  await newChat.save();
	  
			  user.chats = [...user.chats, newChat._id];
			  await user.save();
  
  
  
  
  
  
			  }


          }
       

   
        

        res.status(201).send({ message: "Chat was added", success: true });
      } else {
        if (language) {
          if (language === "am") {
            res
              .status(200)
              .send({ message: "Օգտատերը չի գտնվել", success: false });
            // return {status: 200, message: "Օգտատերը չի գտնվել", success:false}
          }
          if (language === "ru") {
            res
              .status(200)
              .send({ message: "Пользователь не найден", success: false });
            // return {status: 200, message: "Пользователь не найден", success:false}
          }
          if (language === "en") {
            res.status(200).send({ message: "User Not Found", success: false });

            // return {status: 200, message: "User Not Found", success:false}
          }
        } else {
          res.status(200).send({ message: "User Not Found", success: false });

          // return {status: 200, message: "User Not Found", success:false}
        }
      }
    } else {
      res.status(400).send({ message: "Bad Request" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

const serviceAccount = require("./chatandroid-f0d79-firebase-adminsdk-6y56u-66de292809.json");
const Chats = require("./Model/Chats.js");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendPushNotification = (token) => {
  const message = {
    notification: {
      title: "Special Offer",
      body: "Try your Luck",
    },
    token: token,
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};

// cron.schedule("*/30 * * * * *", async () => {
//   const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

//   const inactiveUsers = await User.find({
//     lastLogin: { $lt: twentyFourHoursAgo },
//   });

//   inactiveUsers.forEach((user) => {
//     sendPushNotification(user.firebaseToken);
//   });
// });

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
  pingInterval: 25000, // Interval for sending pings (default: 25,000 ms)
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


  socket.emit("me", socket.id);

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("hey", {
      from: data.from,
      roomId: data.roomId,
    });
  });

 



  socket.on("disconnect", async () => {
    delete users[socket.id];

    const findOnlineUser = await OnlineUsers.findOne({ socketID: socket.id });

	userCount = userCount.filter((u) => u.socketID !== socket.id);

	const findRoom = newRoomConnect.find(r=> r.roomMembers.includes(socket.id))
	const participant = findRoom?.roomMembers?.find(r=> r !== socket.id)
	let findEnded = room_ended.find((r) => r.roomId === findRoom.roomId);

	const findParticipant = await OnlineUsers.findOne({ socketID: participant });

    if (findOnlineUser) {
      findOnlineUser.status = "offline";
	  findParticipant.status = "offline";
      await Promise.all([findOnlineUser.save(), findParticipant.save()]);
    }




	if (findEnded) {
		let state = false;
		room_ended.map((el) => {
		  if (el.roomId === findRoom.roomId) {
			el.endCount += 1;
			el.notSaveCount += 1;
			if (el.endCount === 2) {
			  fs.unlink(`uploads/${findRoom.roomId}`, (err) => {
				  if (err) {
					console.error("Error deleting the file:", err);
					return;
				  }
				});

				state = true;
			}

			if (el.saveCount + el.notSaveCount === 2) {
			  state = true;
			}
		  }
		});

		if (state) {
		  room_ended = room_ended.filter((r) => r.roomId !== findRoom.roomId);
		  newRoomConnect = newRoomConnect.filter(
			(r) => !r.roomMembers.includes(socket.id)
		  );
		}
	  }else{
		room_ended.push({
			roomId: findRoom.roomId,
			endCount:  1,
			saveCount:  0,
			notSaveCount:  1,
		  });
	  }




	  socket.to(participant).emit("end_chat", { message: "Zrucakicy lqec chaty" });

   

    console.log("disconnect-------", socket.id);
  });


  // socket.on("disconnect", async () => {
  //   console.log(`User ${socket.id} disconnected`);
  
  //   // Start a 1-minute timeout for reconnection
  //   const reconnectionTimeout = setTimeout(async () => {
  //     console.log(`User ${socket.id} failed to reconnect within 1 minute. Disconnecting.`);
  
  //     // Remove the user from the active user list
  //     delete users[socket.id];
  
  //     const findOnlineUser = await OnlineUsers.findOne({ socketID: socket.id });
  
  //     // Remove user from userCount list
  //     userCount = userCount.filter((u) => u.socketID !== socket.id);
  
  //     // Find the chat room the user was part of
  //     const findRoom = newRoomConnect.find(r => r.roomMembers.includes(socket.id));
  //     const participant = findRoom?.roomMembers?.find(r => r !== socket.id);
  //     let findEnded = room_ended.find((r) => r.roomId === findRoom.roomId);
  
  //     const findParticipant = await OnlineUsers.findOne({ socketID: participant });
  
  //     if (findOnlineUser) {
  //       findOnlineUser.status = "offline";
  //       if (findParticipant) findParticipant.status = "offline";
  //       await Promise.all([findOnlineUser.save(), findParticipant?.save()]);
  //     }
  
  //     if (findEnded) {
  //       let state = false;
  //       room_ended.map((el) => {
  //         if (el.roomId === findRoom.roomId) {
  //           el.endCount += 1;
  //           el.notSaveCount += 1;
  //           if (el.endCount === 2) {
  //             fs.unlink(`uploads/${findRoom.roomId}`, (err) => {
  //               if (err) {
  //                 console.error("Error deleting the file:", err);
  //                 return;
  //               }
  //             });
  //             state = true;
  //           }
  
  //           if (el.saveCount + el.notSaveCount === 2) {
  //             state = true;
  //           }
  //         }
  //       });
  
  //       if (state) {
  //         room_ended = room_ended.filter((r) => r.roomId !== findRoom.roomId);
  //         newRoomConnect = newRoomConnect.filter((r) => !r.roomMembers.includes(socket.id));
  //       }
  //     } else {
  //       room_ended.push({
  //         roomId: findRoom.roomId,
  //         endCount: 1,
  //         saveCount: 0,
  //         notSaveCount: 1,
  //       });
  //     }
  
  //     // Notify the participant that the chat has ended
  //     socket.to(participant).emit("end_chat", { message: "Chat ended due to disconnection" });
  
  //     console.log("User fully disconnected after timeout", socket.id);
  
  //   }, 60000); // 1 minute = 60,000 milliseconds
  
  //   // If the user reconnects within 1 minute, clear the timeout
  //   socket.on("reconnect", () => {
  //     clearTimeout(reconnectionTimeout);
  //     console.log(`User ${socket.id} reconnected within 1 minute.`);
  //   });
  // });





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

      if(findRoom && findRoom.endCount === 0){
        newRoomConnect.map((r)=>{
          if(r.roomId === info.roomId){
            r.endCount  = r.endCount + 1
            return r
          }else{
            return r
          }
        })
        socket
        .to(participantID)
        .emit("end_chat", { message: "Zrucakicy lqec chaty" });
        console.log("newRoomConnect---------changed--------",newRoomConnect);
      }
      if(findRoom.endCount > 0){
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
          socket.to(info.socketID).emit("close_time",{message:" Pahne Ekel"})
          }, 20000) 
        }
      )
      
      socket.removeAllListeners("message");
      socket.removeAllListeners("image_upload");
      socket.removeAllListeners("sendVoiceMessage");
      socket.removeAllListeners("end_chat");

      
    });

    socket.on("sendVoiceMessage", (data) => {
      const voiceBlob = Buffer.from(new Uint8Array(data.voiceBlob));

      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      let messageTime = `${hours}:${minutes}:${seconds}`;

      let id = generateUniqueId();

      // Save the voice message to the server
	  const folderPath = path.join(__dirname, "uploads", data.roomId);
      const filename = `${uuidv4()}.webm`;
      const filePath = path.join(folderPath, filename);
	  if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath, { recursive: true });
	  }
      fs.writeFile(filePath, voiceBlob, (err) => {
        if (err) {
          console.error("Error saving voice message:", err);
          return;
        }

        // Broadcast the file path to other users in the room
        io.to(data.roomId).emit("receiveVoiceMessage", {
          socketID: data.socketID,
          userId: data.userId,
          voiceUrl: `uploads/${data.roomId}/${filename}`,
          messageID: id,
          messageTime,
        });
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
      intervalUsers = intervalUsers.filter((u)=> u.userId !== info.userId && u.roomId !== info.roomId)
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

// app.get("/api/uploads/:image", (req, res) => {
//   try {
//     const image = req.params.image;
//     const imagePath = path.join(__dirname, "uploads", image);
//     res.sendFile(imagePath);
//   } catch (error) {}
// });

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

const PORT = process.env.PORT || 2000;






server.listen(PORT, () => console.log(`server is running on ${PORT}`));
