const socket =io()
const $messageForm=document.querySelector('#message-form')
const $inputField =$messageForm.querySelector('input')
const $sendButton =$messageForm.querySelector('button')
const $locationSend=document.querySelector("#send-location")
const $messages = document.querySelector("#messages")
const messagetemplate = document.querySelector("#message-template").innerHTML
const locationMessageTemplate =document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {userName , room}=Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
   
    const html =Mustache.render(messagetemplate,{'userName':message.userName,'message':message.text, 'createdAt':moment(message.createdAt).format('hh:mm a')})
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(message)=>{
const html =Mustache.render(locationMessageTemplate,{'userName':message.userName,'url':message.url,'createdAt':moment(message.createdAt).format('hh:mm a')})
$messages.insertAdjacentHTML('beforeend',html)
})

socket.on('roomData',({room , users})=>{
    const html =Mustache.render(sidebarTemplate,{
        'room':room,
        'users':users
    })
    document.querySelector('#sidebar').innerHTML=html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    $sendButton.setAttribute('disabled','disabled')
    const message =e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{
        $sendButton.removeAttribute('disabled')
        $inputField.value=''
        $inputField.focus()
        if(error){
            return console.log(error)
        }

    });
})

$locationSend.addEventListener('click',(e)=>{
    if(!navigator.geolocation){
        return alert("geolocation is not supported by your browser!")
    }
    $locationSend.setAttribute('disable','disable')
    navigator.geolocation.getCurrentPosition((position)=>{
       socket.emit('sendLocation',{
           latitude:position.coords.latitude,
           longitude:position.coords.longitude
        },()=>{
            $locationSend.removeAttribute('disable')
        })
    })
})

socket.emit('join',{userName , room}, (error)=>{

    if(error){
        alert(error)
        location.href='/'
    }

})