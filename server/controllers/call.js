import User from "../models/User.js";
import { io, userSocketMap } from "../server.js";


export  async function audiocall(req, res) {
    

    const receiverId = req.params.id;
    const senderId = req.user._id;
    const receiverSocketId = userSocketMap[receiverId];
    
      const receiver = await User.findById(receiverId);
        if (!receiver) return res.json({ success: false, message: "Receiver user not found" });

        const sender = await User.findById(senderId);
        if (!sender) return res.json({ success: false, message: "Sender user not found" });





    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newCall", {
            name: sender.fullName,
            receiverId,
            senderId,

            
        });
        res.json({ success: true, message: "Audio call endpoint hit" });
    }else{
        res.json({ success: false, message: "User not connected" });
    }
}


