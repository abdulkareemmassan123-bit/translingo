import React, { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ChatContainer = () => {
    const { messages, selectedUser, setSelectedUser, sendMessage, getMessages ,makeAudioCall} = useContext(ChatContext);
    const { authUser, onlineUsers } = useContext(AuthContext);

    const scrollEnd = useRef();

    const [input, setInput] = useState('');
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [playingAudio, setPlayingAudio] = useState(null);
    const [showDeleteOption, setShowDeleteOption] = useState(false);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const recordingStartTimeRef = useRef(0);

    // --- Text message sending ---
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === "") return null;
        await sendMessage({ text: input.trim() });
        setInput("");
    };

    const handelAudioCall = async () => {
        makeAudioCall()
    }

    // --- Image sending ---
    const handleSendImage = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) {
            toast.error("Select an image file");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = async () => {
            await sendMessage({ image: reader.result });
            e.target.value = "";
        };
        reader.readAsDataURL(file);
    };

    // --- Audio recording ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());

                // Only send audio if recording was long enough and not cancelled
                if (audioChunksRef.current.length > 0 && !showDeleteOption) {
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
                    await sendMessage({ audio: file });
                }

                setMediaRecorder(null);
                setRecording(false);
                setShowDeleteOption(false);
                clearTimeout(recordingTimerRef.current);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setRecording(true);
            recordingStartTimeRef.current = Date.now();

            // Set minimum recording time (1 second)
            recordingTimerRef.current = setTimeout(() => {
                // Minimum recording time completed
            }, 1000);
        } catch (err) {
            console.error("Audio recording error:", err);
            toast.error("Audio recording failed");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && recording) {
            const recordingDuration = Date.now() - recordingStartTimeRef.current;

            // If recording is too short, show delete option
            if (recordingDuration < 1000) {
                setShowDeleteOption(true);
            } else {
                mediaRecorder.stop();
            }
        }
    };

    const cancelRecording = () => {
        if (mediaRecorder) {
            // Stop recording without sending
            audioChunksRef.current = [];
            mediaRecorder.stop();
            setShowDeleteOption(false);
        }
    };

    const confirmSendRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
    };

    // --- Custom Audio Player Component ---
    const CustomAudioPlayer = ({ audioUrl, messageId, isOwnMessage }) => {
        const audioRef = useRef(null);
        const [isPlaying, setIsPlaying] = useState(false);
        const [progress, setProgress] = useState(0);
        const [duration, setDuration] = useState(0);
        const [currentTime, setCurrentTime] = useState(0);

        useEffect(() => {
            const audio = audioRef.current;
            if (!audio) return;

            const updateProgress = () => {
                setCurrentTime(audio.currentTime);
                setProgress((audio.currentTime / audio.duration) * 100);
            };

            const handleLoadedMetadata = () => {
                setDuration(audio.duration);
            };

            const handlePlay = () => {
                setIsPlaying(true);
                setPlayingAudio(messageId);
            };

            const handlePause = () => {
                setIsPlaying(false);
                setPlayingAudio(null);
            };

            const handleEnded = () => {
                setIsPlaying(false);
                setProgress(0);
                setCurrentTime(0);
                setPlayingAudio(null);
            };

            audio.addEventListener('timeupdate', updateProgress);
            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            audio.addEventListener('play', handlePlay);
            audio.addEventListener('pause', handlePause);
            audio.addEventListener('ended', handleEnded);

            return () => {
                audio.removeEventListener('timeupdate', updateProgress);
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audio.removeEventListener('play', handlePlay);
                audio.removeEventListener('pause', handlePause);
                audio.removeEventListener('ended', handleEnded);
            };
        }, [messageId]);

        useEffect(() => {
            if (playingAudio !== messageId && isPlaying) {
                setIsPlaying(false);
                audioRef.current?.pause();
            }
        }, [playingAudio, messageId, isPlaying]);

        const togglePlayPause = () => {
            if (audioRef.current) {
                if (isPlaying) {
                    audioRef.current.pause();
                } else {
                    audioRef.current.play();
                }
            }
        };

        const handleSeek = (e) => {
            if (audioRef.current) {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const seekTime = percent * duration;
                audioRef.current.currentTime = seekTime;
                setProgress(percent * 100);
            }
        };

        const formatTime = (time) => {
            if (!time || isNaN(time)) return '0:00';
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        return (
            <div className={`flex flex-col gap-2 mb-8 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-3 p-3 rounded-2xl max-w-xs md:max-w-sm ${isOwnMessage
                        ? 'bg-violet-500/30 rounded-br-none'
                        : 'bg-gray-600/30 rounded-bl-none'
                    }`}>
                    <button
                        onClick={togglePlayPause}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${isOwnMessage ? 'bg-violet-600 text-white' : 'bg-gray-600 text-white'
                            } hover:scale-105 active:scale-95`}
                    >
                        {isPlaying ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    <div className="flex-1 min-w-0 w-full">
                        <div
                            className="w-full h-2 bg-white/20 rounded-full cursor-pointer relative group"
                            onClick={handleSeek}
                        >
                            <div
                                className={`h-full rounded-full transition-all duration-200 ${isOwnMessage ? 'bg-violet-400' : 'bg-gray-400'
                                    }`}
                                style={{ width: `${progress}%` }}
                            />
                            <div
                                className={`absolute top-1/2 w-3 h-3 rounded-full -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${isOwnMessage ? 'bg-violet-300' : 'bg-gray-300'
                                    }`}
                                style={{
                                    left: `${progress}%`,
                                    transform: `translate(-50%, -50%)`,
                                    marginTop: '0px'
                                }}
                            />
                        </div>

                        <div className="flex justify-between text-xs mt-1 text-white/70">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                </div>

                <audio ref={audioRef} preload="metadata" className="hidden">
                    <source src={`http://localhost:5000${audioUrl}`} type="audio/webm" />
                    Your browser does not support the audio element.
                </audio>
            </div>
        );
    };

    // --- Fetch messages on user change ---
    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id);
        }
    }, [selectedUser]);

    // --- Scroll to bottom when messages update ---
    useEffect(() => {
        if (scrollEnd.current && messages) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    if (!selectedUser) {
        return (
            <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
                <img src={assets.logo} className='max-w-70' alt="" />
                <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
            </div>
        );
    }

    return (
        <div className='h-full overflow-scroll relative backdrop-blur-lg'>
            {/* ------- Header ------- */}
            <div className='flex items-center gap-3 py-3 mx-4'>
                <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-8 rounded-full" />
                <p className='flex-1 text-lg text-white flex items-center gap-2'>
                    {selectedUser.fullName}
                    {onlineUsers.includes(selectedUser._id) && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                </p>
                <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7' />

                <button onClick={handelAudioCall} className="w-8 h-8 bg-gray-600/30 rounded-full flex items-center justify-center hover:bg-gray-500/40 transition-colors duration-200 mr-2">call</button>

                <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
            </div>

            {/* ------- Chat Area ------- */}
            <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
                {messages.map((msg, index) => {
                    const isOwnMessage = msg.senderId === authUser._id;

                    // Fixed audio path normalization
                    const normalizeAudioPath = (path) => {
                        if (!path) return null;

                        // Convert backslashes to forward slashes
                        let normalized = path.replace(/\\/g, '/');

                        // Handle different path formats
                        if (normalized.includes('uploads/translates//uploads/')) {
                            normalized = normalized.replace('uploads/translates//uploads/', '/uploads/translates/');
                        } else if (normalized.includes('/uploads/')) {
                            const uploadsIndex = normalized.indexOf('/uploads/');
                            normalized = normalized.substring(uploadsIndex);
                        } else if (normalized.startsWith('uploads/')) {
                            normalized = '/' + normalized;
                        }

                        // Remove any trailing slashes
                        normalized = normalized.replace(/[\/\\]+$/, '');

                        return normalized;
                    };

                    // For sender: always use original audio
                    // For receiver: prefer translated audio, fallback to original
                    const audioUrl = isOwnMessage
                        ? normalizeAudioPath(msg.Orignalaudio)
                        : normalizeAudioPath(msg.translatedOrignalaudio) || normalizeAudioPath(msg.Orignalaudio);

                    // --- Custom Audio Player ---
                    const CustomAudioPlayer = ({ audioUrl, messageId, isOwnMessage }) => {
                        const audioRef = useRef(null);
                        const [isPlaying, setIsPlaying] = useState(false);
                        const [progress, setProgress] = useState(0);
                        const [duration, setDuration] = useState(0);
                        const [currentTime, setCurrentTime] = useState(0);

                        useEffect(() => {
                            const audio = audioRef.current;
                            if (!audio) return;

                            const updateProgress = () => {
                                setCurrentTime(audio.currentTime);
                                setProgress((audio.currentTime / audio.duration) * 100);
                            };

                            const handleLoadedMetadata = () => setDuration(audio.duration);
                            const handlePlay = () => setIsPlaying(true);
                            const handlePause = () => setIsPlaying(false);
                            const handleEnded = () => {
                                setIsPlaying(false);
                                setProgress(0);
                                setCurrentTime(0);
                            };

                            audio.addEventListener('timeupdate', updateProgress);
                            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
                            audio.addEventListener('play', handlePlay);
                            audio.addEventListener('pause', handlePause);
                            audio.addEventListener('ended', handleEnded);

                            return () => {
                                audio.removeEventListener('timeupdate', updateProgress);
                                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                                audio.removeEventListener('play', handlePlay);
                                audio.removeEventListener('pause', handlePause);
                                audio.removeEventListener('ended', handleEnded);
                                if (!audio.paused) audio.pause();
                            };
                        }, [audioUrl]);

                        const togglePlayPause = () => {
                            if (!audioRef.current) return;
                            try {
                                if (isPlaying) {
                                    audioRef.current.pause();
                                } else {
                                    audioRef.current.play();
                                }
                            } catch (err) {
                                console.warn("Audio play aborted:", err);
                            }
                        };

                        const handleSeek = (e) => {
                            if (audioRef.current) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const percent = (e.clientX - rect.left) / rect.width;
                                audioRef.current.currentTime = percent * duration;
                                setProgress(percent * 100);
                            }
                        };

                        const formatTime = (time) => {
                            if (!time || isNaN(time)) return '0:00';
                            const minutes = Math.floor(time / 60);
                            const seconds = Math.floor(time % 60);
                            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                        };

                        return (
                            <div className={`flex flex-col gap-2 mb-8 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-center gap-3 p-3 rounded-2xl max-w-xs md:max-w-sm ${isOwnMessage ? 'bg-violet-500/30 rounded-br-none' : 'bg-gray-600/30 rounded-bl-none'
                                    }`}>
                                    <button
                                        onClick={togglePlayPause}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${isOwnMessage ? 'bg-violet-600 text-white' : 'bg-gray-600 text-white'
                                            } hover:scale-105`}
                                    >
                                        {isPlaying ? (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        )}
                                    </button>

                                    <div className="flex-1 min-w-0 w-full">
                                        <div
                                            className="w-full h-2 bg-white/20 rounded-full cursor-pointer relative group"
                                            onClick={handleSeek}
                                        >
                                            <div
                                                className={`h-full rounded-full ${isOwnMessage ? 'bg-violet-400' : 'bg-gray-400'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                            <div
                                                className={`absolute top-1/2 w-3 h-3 rounded-full -translate-y-1/2 opacity-0 group-hover:opacity-100 ${isOwnMessage ? 'bg-violet-300' : 'bg-gray-300'}`}
                                                style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs mt-1 text-white/70">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>
                                </div>

                                <audio ref={audioRef} preload="metadata" className="hidden">
                                    <source src={`http://localhost:5000${audioUrl}`} type="audio/webm" />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        );
                    };

                    return (
                        <div
                            key={index}
                            className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                            {/* Image message */}
                            {msg.image ? (
                                <img
                                    src={msg.image}
                                    alt=""
                                    className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8'
                                />
                            ) : audioUrl ? (
                                <CustomAudioPlayer
                                    audioUrl={audioUrl}
                                    messageId={msg._id || index}
                                    isOwnMessage={isOwnMessage}
                                />
                            ) : (
                                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                    <p
                                        className={`p-3 max-w-[200px] md:max-w-[300px] md:text-sm font-light rounded-2xl mb-2 break-words ${isOwnMessage
                                                ? 'bg-violet-500/30 text-white rounded-br-none'
                                                : 'bg-gray-600/30 text-white rounded-bl-none'
                                            }`}
                                        style={{ wordBreak: 'break-word' }}
                                    >
                                        {isOwnMessage ? msg.Orignaltext : msg.translatedText}
                                    </p>
                                </div>
                            )}

                            <div className="text-center text-xs min-w-[50px]">
                                <img
                                    src={isOwnMessage ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon}
                                    alt=""
                                    className='w-7 rounded-full mx-auto'
                                />
                                <p className='text-gray-500 mt-1'>{formatMessageTime(msg.createdAt)}</p>
                            </div>
                        </div>
                    );
                })}

                <div ref={scrollEnd}></div>
            </div>

            {/* ------- Bottom Area ------- */}
            <div className='absolute bottom-0 left-0 right-0 flex items-center gap-2 md:gap-3 p-3'>
                <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
                    <input
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                        onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null}
                        type="text"
                        placeholder="Send a message"
                        className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400'
                    />

                    <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
                    <label htmlFor="image">
                        <img src={assets.gallery_icon} alt="" className="w-5 mr-2 cursor-pointer" />
                    </label>
                </div>

                {/* Audio record button */}
                {showDeleteOption ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={cancelRecording}
                            className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors duration-200"
                        >
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>
                        <button
                            onClick={confirmSendRecording}
                            className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 transition-colors duration-200"
                        >
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <button
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${recording
                                ? 'bg-red-500 animate-pulse'
                                : 'bg-gray-600 hover:bg-gray-500'
                            }`}
                    >
                        {recording ? (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 6h12v12H6z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                            </svg>
                        )}
                    </button>
                )}

                <button
                    onClick={handleSendMessage}
                    className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center hover:bg-violet-500 transition-colors duration-200 flex-shrink-0"
                >
                    <img src={assets.send_button} alt="Send" className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default ChatContainer;