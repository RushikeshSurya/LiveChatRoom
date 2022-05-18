const path =require('path')
const express=require('express')
const http = require('http')
const socketio =require('socket.io')
const { listen } = require('express/lib/application')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} =require('./utils/messages')
const {addUser , removeUser , getUser , getUsersInRoom} = require('./utils/users')


const app = express()
const server = http.createServer(app)
const port =process.env.PORT || 3000
const io= socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))
let count =0
io.on("connection", (socket)=>{
    

    socket.on('join',({userName , room}, callback)=>{
        const {error , user}=addUser({id:socket.id , userName, room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.userName} has joined!`))
        io.to(user.room).emit('roomData',{
            'room':user.room,
            'users':getUsersInRoom(user.room)
        })
        callback()

    })
    
    socket.on('sendMessage',(msg,callback)=>{
        const user =getUser(socket.id)
        const filter =new Filter()
        if(filter.isProfane(msg)){
            return callback("profane language is not allowed !")
        }
        io.to(user.room).emit('message',generateMessage(user.userName,msg))
        callback()
    })
    socket.on('sendLocation',(coords, callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.userName,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.userName} has left!`))
            io.to(user.room).emit('roomData',{
                'room':user.room,
                'users':getUsersInRoom(user.room)
            })
        }
        
    })
})
server.listen(port,()=>{
    console.log('Listening on 3000...')
})