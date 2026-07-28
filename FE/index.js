const clientIo=io("http://localhost:3000",{
    auth:{
        authorization:`admin ${localStorage.getItem("authorization")}`
    }
})
const clientIoAdmin=io("http://localhost:3000/admin")

// clientIo.emit("hi","hi from fe")
// clientIo.on("sayHiBack",(data)=>{
//     console.log({data});
// })
// clientIo.emit("ackHi","hi from fe as ack",(data)=>{
//     console.log({data}); 
// })
// clientIoAdmin.emit("ackHi","hi from fe as admin",(data)=>{
//     console.log({data});
// })


// clientIo.emit("hiFatma",{id:localStorage.getItem("socketId")})

clientIo.on("connect_error",(error)=>{
    console.log({error});
})