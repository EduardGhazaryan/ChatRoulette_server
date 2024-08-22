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
				to : "edoghazaryan7@gmail.com",
				subject : from,
				text : text
			}
			console.log(mailOptions);
	
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


app.post('/api/save-token', (req, res) => {
	const { token } = req.body;
	if (token && !tokens.includes(token)) {
	  tokens.push(token);
	  console.log('Token saved:', token);
	}
	res.sendStatus(200);
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
  
  // Send notifications every 30 seconds
  setInterval(() => {
	tokens.forEach(token => {
	  sendPushNotification(token);
	});
  }, 30000);


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
	cors: {
		origin: "http://localhost:8081",
		methods: [ "GET", "POST" ]
	}
})
console.log("1");
const users = {}
let all_connected_users = []
let newRoomConnect = []
let userCount = []

io.on("connection", (socket) => {
	if (!users[socket.id]) {
		users[socket.id] = socket.id;
	}
	console.log("connected", socket.id);
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
		// let roomClients 
		// let numberOfClients 
		userName_cookie = payload.socketID
		console.log("join-----",payload);
		const findChat = newRoomConnect.find((chat)=> chat.roomMembers.includes(payload.socketID) && chat.roomMembers.includes(payload.participant))

		if(findChat){
			roomId = findChat.roomId
			socket.join(findChat.roomId)
		// 	all_connected_users.map((r) => {
		// 	if (r.room_id === findChat.roomId) {
		// 		r.room_members.push(socket.id)
		// 	}
		// })
			socket.emit('room_joined', {
				roomId: findChat.roomId,
				peerId: socket.id,
				all_users: newRoomConnect
			})
			console.log("join------", newRoomConnect);
		
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


				//  roomClients = io.sockets.adapter.rooms.get(roomId) || { size: 0 }
				//  numberOfClients = roomClients.size

			socket.join(roomId)
			console.log(`Creating room ${roomId} and emitting room_created socket event`)
			// all_connected_users.push({
			// 	room_id: roomId,
			// 	room_members: [userName_cookie]
			// })
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
					findUser.chatBonus = findUser.chatBonus + 1

					await findUser.save()
				}
			}else{
				userCount.push({socketID: findBySocketID, roomId: message.roomId, chatBonus: 1})
				findUser.chatBonus = findUser.chatBonus + 1
					await findUser.save()
			}
			
			


			console.log("newRoomConnect", newRoomConnect);
			console.log("countUser", userCount);
			let id = generateUniqueId()
			io.to(roomId).emit('createMessage', {...message, messageID: id, messageTime });
		});
		
		socket.on('image_upload', (data) => {
			const buffer = Buffer.from(data.image, 'base64');
			console.log("image-data-------",data);
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
			const imageUrl = `/uploads/${fileName}`;
			io.to(roomId).emit('receive_image', { imageUrl,userId:data.userId, socketID:data.socketID, messageTime , messageID:id});
		  });
		socket.on('end_chat',async (info)=>{
			findRoom = newRoomConnect.find((r)=> r.roomId === info.roomId)
			let participantID = findRoom?.roomMembers?.find((u)=> u !== info.socketID)

			if(info.chat){
				info.chat.map(el=>{
					if(el.img){
						fs.unlink(`${img}`, (err) => {
							if (err) {
								console.error('Error deleting the file:', err);
								return;
							}
							console.log('File deleted successfully');
						});
					}
					if(el.voice){
						fs.unlink(`${voice}`, (err) => {
							if (err) {
								console.error('Error deleting the file:', err);
								return;
							}
							console.log('File deleted successfully');
						});
					}
				})
			}

			const findOnlineUser = await OnlineUsers.findOne({user: info.userId})

			if(findOnlineUser){
				findOnlineUser.status = "offline"
				await findOnlineUser.save()
			}

			userCount = userCount.filter(u=> u.roomId !== info.roomId && u.socketID !== info.socketID)
	
			newRoomConnect = newRoomConnect.filter((r)=>r.roomId !== info.roomId)


			socket.to(participantID).emit("end_chat",{})
			
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