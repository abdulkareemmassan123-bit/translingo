import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage } from "../controllers/messageController.js";
import {audiocall} from "../controllers/call.js"
import upload from "../utilts/multer.js"
const messageRouter = express.Router();



const conditionalUpload = (req, res, next) => {



  
  if (req.headers['content-type']?.startsWith('multipart/form-data')) {
    upload.single('audio')(req, res, (err) => {
      if (err){
        console.log(err);
        
         return res.status(400).json({ error: err.message });
      }
      next();
    });
  } else {
    
    next();
  }
};

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, conditionalUpload, sendMessage)
messageRouter.post("/audiocall/:id", protectRoute, audiocall)

export default messageRouter;