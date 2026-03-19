import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
const router = express.Router();
// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const hasCloudinaryConfig = () => !!(process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET);
// Configure multer to handle memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: folder,
            resource_type: 'image',
            format: 'jpg',
            quality: 'auto',
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else if (result) {
                resolve(result.secure_url);
            }
            else {
                reject(new Error('Upload failed: No result from Cloudinary'));
            }
        });
        const stream = Readable.from(buffer);
        stream.pipe(uploadStream);
    });
};
// Upload single image
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!hasCloudinaryConfig()) {
            console.error('Upload failed: Cloudinary env (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET) not set');
            return res.status(503).json({ error: 'Image upload is not configured' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        const folder = (req.body && req.body.folder) || 'XTrimFitGym/progress-images';
        const imageUrl = await uploadToCloudinary(req.file.buffer, folder);
        res.json({ url: imageUrl });
    }
    catch (error) {
        console.error('Upload error:', error);
        const msg = error?.message || 'Failed to upload image';
        res.status(500).json({ error: msg });
    }
});
// Upload multiple images
router.post('/images', upload.array('images', 4), async (req, res) => {
    try {
        if (!hasCloudinaryConfig()) {
            console.error('Upload failed: Cloudinary env not set');
            return res.status(503).json({ error: 'Image upload is not configured' });
        }
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ error: 'No image files provided' });
        }
        const folder = (req.body && req.body.folder) || 'XTrimFitGym/progress-images';
        const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, folder));
        const urls = await Promise.all(uploadPromises);
        res.json({ urls });
    }
    catch (error) {
        console.error('Upload error:', error);
        const msg = error?.message || 'Failed to upload images';
        res.status(500).json({ error: msg });
    }
});
export default router;
