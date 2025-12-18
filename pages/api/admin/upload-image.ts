import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser || !dbUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Создаем директорию для загрузок если её нет
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
    console.log('📂 Upload directory:', uploadDir);
    console.log('📂 Current working directory:', process.cwd());

    if (!fs.existsSync(uploadDir)) {
      console.log('⚠️  Upload directory does not exist, creating...');
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('✅ Upload directory created');
    } else {
      console.log('✅ Upload directory exists');
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filename: (name, ext, part) => {
        return `photo_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
      }
    });

    // Используем промис вместо колбэка для лучшей обработки ошибок
    const [fields, files] = await form.parse(req);

    console.log('📁 Files received:', Object.keys(files));

    const file = files.image;
    if (!file) {
      console.error('No image file found in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Получаем первый файл если это массив
    const uploadedFile = Array.isArray(file) ? file[0] : file;
    const fileName = path.basename(uploadedFile.filepath);
    const fullPath = uploadedFile.filepath;
    const imageUrl = `/uploads/photos/${fileName}`;

    console.log('✅ File uploaded successfully:');
    console.log('   - Original name:', uploadedFile.originalFilename);
    console.log('   - Saved as:', fileName);
    console.log('   - Full path:', fullPath);
    console.log('   - URL:', imageUrl);
    console.log('   - File exists:', fs.existsSync(fullPath));

    return res.status(200).json({ url: imageUrl });

  } catch (error: any) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
