const express = require("express")
const http = require("http")
const dotenv = require("dotenv").config()
const cors = require("cors")
const path = require("path")
const fs = require("fs")
const admin = require("firebase-admin")
const nodemailer = require("nodemailer")
const uuid = require("uuid")
const { v4: uuidv4 } = require('uuid');
const multer = require("multer")
const cron = require("node-cron")


const CorsOptions = require("./Config/CorsOptions.js")
const Connection = require("./Utils/Connection.js")


const AuthRouter = require("./Router/AuthRouter.js")
const UserRouter = require("./Router/UserRouter.js")
const User = require("./Model/User.js")
const OnlineUsers = require("./Model/OnlineUsers.js")



const app = express()
Connection()
const server = http.createServer(app)

app.use(cors(CorsOptions))
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const transporter =  nodemailer.createTransport({
	service : "gmail",
	auth : {
		user : process.env.EMAIL,
		pass : process.env.PASSWORD
	}
})

app.use("/api/auth", AuthRouter)
app.use("/api/user", UserRouter)
app.post("/api/mail", async (req,res)=>{
	try {
		const {from,text} = req.body
		const language = req.headers["accept-language"]

		if(from && text){
			const mailOptions = {
				from : process.env.EMAIL,
				to : "webexprojects@gmail.com",
				subject : from,
				text : text
			}
	
	
			await transporter.sendMail(mailOptions)
	
			if(language){
				if(language === "am"){
					res.status(201).send({message:"Ձեր նամակը հաջողությամ ուղարկվել է ձեզ հետ կապ կհաստատեն նշված էլէկտրոնային հասցեով", 								success:true})
				
				}
				if(language === "ru"){
					res.status(201).send({message:"Ваше электронное письмо было успешно отправлено, и с вами свяжутся по указанному адресу электронной 	`					почты.", success:true})
				}
				if(language === "en"){
					res.status(201).send({message:"Your email has been successfully sent, and you will be contacted at the email address you 								provided.", 	success:true})
				}
			}else{
				res.status(201).send({message:"Your email has been successfully sent, and you will be contacted at the email address you 								provided.", 	success:true})
			}
		}

	} catch (error) {
		console.error(error)
		res.status(500).send("Internal Server Error")
	}
	
})



//-----------------------Firebase start----------------
let tokens = []; 


app.post('/api/save-token', async (req, res) => {
	try {
		const { token,phoneID } = req.body;
		
	if (token && phoneID) {
	
		const findUser = await User.findOne({phoneID})
		if(findUser){
			findUser.firebaseToken = token
			await findUser.save()
			tokens.push(token);
	  		
			  res.sendStatus(201)
		}else{
			res.sendStatus(404)
		}
	}
	
	} catch (error) {
		console.error(error)
		res.status(500).send({message:"Internal Server Error"})
	}
  });


const serviceAccount = require("./chatandroid-f0d79-firebase-adminsdk-6y56u-66de292809.json")

admin.initializeApp({
	credential : admin.credential.cert(serviceAccount)
})


const sendPushNotification = (token) => {
	const message = {
	  notification: {
		title: 'Special Offer',
		body: 'Try your Luck',
	  },
	  token: token,
	};
  
	admin.messaging().send(message)
	  .then((response) => {
		console.log('Successfully sent message:', response);
	  })
	  .catch((error) => {
		console.log('Error sending message:', error);
	  });
  };
  


cron.schedule('*/30 * * * * *', async () => {
	const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
	

	const inactiveUsers = await User.find({ lastLogin: { $lt: twentyFourHoursAgo } });
  
	inactiveUsers.forEach(user => {

	sendPushNotification(user.firebaseToken)
	});
  });


//-----------------------Firebase end----------------



// ---------------------voice start

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
	  cb(null, 'uploads/');
	},
	filename: (req, file, cb) => {
	  cb(null, uuid.v4() + path.extname(file.originalname));
	},
  });
  
  const upload = multer({ storage });
  
  // Ensure the uploads directory exists
  if (!fs.existsSync('uploads')) {
	fs.mkdirSync('uploads');
  }
  
  // Route to handle audio uploads
//   app.post('/upload-audio', upload.single('audio'), (req, res) => {
// 	if (req.file) {
// 		console.log("file---",req);
// 	  res.json({ filePath: `uploads/${req.file.filename}` });
// 	} else {
// 	  res.status(400).json({ error: 'File upload failed' });
// 	}
//   });







// ------------------------voice end



function getRandomRoomName(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let roomName = '';
    
    for (let i = 0; i < length; i++) {
        roomName += characters.charAt(Math.floor(Math.random() * characters.length));
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
		methods: [ "GET", "POST" ]
	}
})
console.log("1");
const users = {}
let room_ended = []
let newRoomConnect = []
let userCount = []

io.on("connection", (socket) => {
	if (!users[socket.id]) {
		users[socket.id] = socket.id;
	}


	socket.emit("me", socket.id)
	
	
	
	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit('hey', {from: data.from,roomId:data.roomId});
	})
	socket.on('disconnect', async () => {	  
		delete users[socket.id];

		const findOnlineUser = await OnlineUsers.findOne({socketID:socket.id})

		if(findOnlineUser){
			findOnlineUser.status = "offline"
			await findOnlineUser.save()
		}
		userCount = userCount.filter(u=>  u.socketID !== socket.id)
	
		newRoomConnect = newRoomConnect.filter((r)=> !r.roomMembers.includes(socket.id))

		console.log("disconnect-------",socket.id);
		
	  })


	socket.on("join", async (payload,) => {
		let roomId = getRandomRoomName()

		

		userName_cookie = payload.socketID

		const findChat = newRoomConnect.find((chat)=> chat.roomMembers.includes(payload.socketID) && chat.roomMembers.includes(payload.participant))

		if(findChat){
			roomId = findChat.roomId
			socket.join(findChat.roomId)
	
			socket.emit('room_joined', {
				roomId: findChat.roomId,
				peerId: socket.id,
				all_users: newRoomConnect
			})
			
			console.log("room_joined----",{roomId,socket:socket.id,user:payload.userId, participant:payload.participant});
		
			const findOnlineUser = await OnlineUsers.findOne({user: payload.userId})

			if(findOnlineUser){
				findOnlineUser.status = "offline"
				await findOnlineUser.save()
			}

		}else{
			newRoomConnect.push({
				roomId,
				roomMembers : [payload.socketID, payload.participant]
			})


			

			socket.join(roomId)

			console.log("room_created----",{roomId,socket:socket.id,user:payload.userId, participant:payload.participant})
			socket.emit('room_created', {
				roomId: roomId,
				peerId: socket.id,
				all_users: newRoomConnect
			})

			const findOnlineUser = await OnlineUsers.findOne({user: payload.userId})

			if(findOnlineUser){
				findOnlineUser.status = "offline"
				await findOnlineUser.save()
			}
		}
		

		socket.on('message', async (message) => {
			console.log("new-message----",message);
			const now = new Date();
			const hours = now.getHours().toString().padStart(2, '0');
			const minutes = now.getMinutes().toString().padStart(2, '0');
			const seconds = now.getSeconds().toString().padStart(2, '0');
			let messageTime = `${hours}:${minutes}:${seconds}`

			let findRoom = newRoomConnect.find((r)=>r.roomId  === message.roomId)
			let findBySocketID = findRoom.roomMembers.find((id)=> id !== message.from)
			const findUser = await User.findOne({socketID: findBySocketID})

			let findUserCount = userCount.find((r)=> r.roomId === message.roomId && r.socketID === findBySocketID)

			if(findUserCount){
				if(findUserCount.chatBonus < 20){
					userCount.map((r)=>{
						if(r.roomId === message.roomId && r.socketID === findBySocketID){
							r.chatBonus = r.chatBonus + 1
						}
					})
					findUser.bonus = findUser.bonus + 1

					await findUser.save()
				}
			}else{
				userCount.push({socketID: findBySocketID, roomId: message.roomId, chatBonus: 1})
				findUser.bonus = findUser.bonus + 1
					await findUser.save()
			}
			
			


			let id = generateUniqueId()
			console.log("gnacox message-----");
			io.to(roomId).emit('createMessage', {...message, messageID: id, messageTime });
		});
		
		socket.on('image_upload', (data) => {
			const buffer = Buffer.from(data.image, 'base64');
			console.log("image----", data);
			const now = new Date();
			const hours = now.getHours().toString().padStart(2, '0');
			const minutes = now.getMinutes().toString().padStart(2, '0');
			const seconds = now.getSeconds().toString().padStart(2, '0');
			let messageTime = `${hours}:${minutes}:${seconds}`

			let id = generateUniqueId()
			

			const fileName = `${Date.now()}.jpg`;
			const filePath = path.join(__dirname, 'uploads', fileName);

			fs.writeFile(filePath, buffer, (err) => {
			  if (err) {
				console.error(err);
			  } else {
				
			  }
			});
			const imageUrl = `uploads/${fileName}`;
		
			io.to(roomId).emit('receive_image', { imageUrl,userId:data.userId, socketID:data.socketID, messageTime , messageID:id});
		  });
		socket.on('end_chat',async (info)=>{
			
			findRoom = newRoomConnect.find((r)=> r.roomId === info.roomId)
			let participantID = findRoom?.roomMembers?.find((u)=> u !== info.socketID)
			let findEnded = room_ended.find(r=> r.roomId === info.roomId)

			if(findEnded){
				if(info.save === false){
					let state = false
					room_ended.map((el)=>{
						if(el.roomId === info.roomId){
							el.endCount += 1
							if(el.endCount === 2){
							
								if(info.chat){
									info.chat.map(el=>{
										if(el.imageUrl){
											fs.unlink(`${el.imageUrl}`, (err) => {
												if (err) {
													console.error('Error deleting the file:', err);
													return;
												}
											
											});
										}
										if(el.voiceUrl){
											fs.unlink(`${el.voiceUrl}`, (err) => {
												if (err) {
													console.error('Error deleting the file:', err);
													return;
												}
											
											});
										}
									})

									state = true
								}
							}
						}
					})

					if(state){
						room_ended = room_ended.filter((r)=> r.roomId !== info.roomId)
					}
				}
			}else{
				room_ended.push({
					roomId: info.roomId,
					endCount : info.save ? 0 : 1
				})
			}


			

			const findOnlineUser = await OnlineUsers.findOne({user: info.userId})

			if(findOnlineUser){
				findOnlineUser.status = "offline"
				await findOnlineUser.save()
			}

			userCount = userCount.filter(u=> u.roomId !== info.roomId && u.socketID !== info.socketID)
	
			newRoomConnect = newRoomConnect.filter((r)=>r.roomId !== info.roomId)


			socket.to(participantID).emit("end_chat",{message: "Zrucakicy lqec chaty"})

			socket.removeAllListeners('message');
			socket.removeAllListeners('image_upload');
			socket.removeAllListeners('sendVoiceMessage');
			socket.removeAllListeners('end_chat');


			console.log("ende-rooms-----",room_ended);
			
		})

	


		socket.on('sendVoiceMessage', (data) => {
			const voiceBlob = Buffer.from(new Uint8Array(data.voiceBlob));

			const now = new Date();
			const hours = now.getHours().toString().padStart(2, '0');
			const minutes = now.getMinutes().toString().padStart(2, '0');
			const seconds = now.getSeconds().toString().padStart(2, '0');
			let messageTime = `${hours}:${minutes}:${seconds}`
			
			let id = generateUniqueId()
	
			// Save the voice message to the server
			const filename = `${uuidv4()}.webm`;
			const filePath = path.join('uploads/', filename);
			fs.writeFile(filePath, voiceBlob, (err) => {
				if (err) {
					console.error('Error saving voice message:', err);
					return;
				}
			
				// Broadcast the file path to other users in the room
				io.to(data.roomId).emit('receiveVoiceMessage', {
					socketID: data.socketID,
					userId : data.userId,
					voiceUrl: `uploads/${filename}`,
					messageID : id,
					messageTime,
				});
			});
		});
	


	})

})

app.get("/api/uploads/:image",(req,res)=>{
	try {
		const image=req.params.image
		const imagePath=path.join(__dirname,"uploads",image)
		res.sendFile(imagePath)
	} catch (error) {
		
	}
})




const PORT = process.env.PORT || 2000


server.listen(PORT, () => console.log(`server is running on ${PORT}`))