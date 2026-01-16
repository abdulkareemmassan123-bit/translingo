import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js"
import { io, userSocketMap } from "../server.js";



import translateWithGeminiFlash from "../utilts/translation.js";
import textToSpeech from "../utilts/textToSpeech.js";
import SpeechToText from "../utilts/speechToText.js";



import path from "path";



export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        // Count number of messages not seen
        const unseenMessages = {}
        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({ senderId: user._id, receiverId: userId, seen: false })
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.json({ success: true, users: filteredUsers, unseenMessages })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ]
        })
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });

        res.json({ success: true, messages })


    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true })
        res.json({ success: true })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let originalAudioPath = req.file ? req.file.path.replace('public', '') : "";
        let translatedAudioPath = "";

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) return res.json({ success: false, message: "Receiver user not found" });

        const sender = await User.findById(senderId);
        if (!sender) return res.json({ success: false, message: "Sender user not found" });

        let translatedText = text;

        if (sender.language !== receiver.language) {
            translatedText = await translateWithGeminiFlash(text, receiver.language);

            if (originalAudioPath) {
                // Convert original speech to text
                const transcribedText = await SpeechToText(req.file.path);
                
                // Translate the transcribed text
                translatedText = await translateWithGeminiFlash(transcribedText, receiver.language);

                // Generate translated audio
                const newAudioFilePath = await textToSpeech(translatedText, "male", receiver.language);
                translatedAudioPath = "uploads/translates/" + newAudioFilePath;
            }
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            Orignaltext: text,
            translatedText,
            Orignalaudio: originalAudioPath,
            translatedOrignalaudio: translatedAudioPath,
            image: imageUrl
        });

        // Emit message to receiver
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", newMessage);

        res.json({ success: true, newMessage });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};