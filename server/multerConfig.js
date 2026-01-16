import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directories exist
const createUploadDirs = () => {
    const dirs = [
        'public/uploads/images',
        'public/uploads/audio',
        'public/uploads/translates',
        'public/uploads/profiles'
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

// Storage configuration for images
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/images');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage configuration for audio
const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/audio');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage configuration for profile pictures
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/profiles');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// File filter for audio
const audioFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
    } else {
        cb(new Error('Only audio files are allowed!'), false);
    }
};

// Create multer instances
export const uploadImage = multer({ 
    storage: imageStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadAudio = multer({ 
    storage: audioStorage,
    fileFilter: audioFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const uploadProfile = multer({ 
    storage: profileStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// For multiple file types in messages
export const uploadMessageFiles = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, 'public/uploads/images');
            } else if (file.mimetype.startsWith('audio/')) {
                cb(null, 'public/uploads/audio');
            } else {
                cb(new Error('Unsupported file type'), false);
            }
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const prefix = file.mimetype.startsWith('image/') ? 'image-' : 'audio-';
            cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and audio files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 2 // Maximum 2 files (one image and one audio)
    }
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
]);