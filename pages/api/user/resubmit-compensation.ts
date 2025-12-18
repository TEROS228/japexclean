import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // Parse form data with files
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'compensation');

    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      multiples: true,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const requestId = Array.isArray(fields.requestId) ? fields.requestId[0] : fields.requestId;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;

    if (!requestId || !description) {
      return res.status(400).json({ error: 'Request ID and description are required' });
    }

    // Verify request belongs to user
    const existingRequest = await prisma.compensationRequest.findFirst({
      where: {
        id: requestId,
        userId: userId,
      },
    });

    if (!existingRequest) {
      return res.status(404).json({ error: 'Compensation request not found' });
    }

    // Check if request status is Rejected
    if (existingRequest.status !== 'Rejected') {
      return res.status(400).json({ error: 'Only rejected requests can be resubmitted' });
    }

    // Process new uploaded files (if any)
    let uploadedFiles: string[] = [];
    const filesArray = Array.isArray(files.files) ? files.files : files.files ? [files.files] : [];

    for (const file of filesArray) {
      if (file && 'filepath' in file) {
        const fileName = path.basename(file.filepath);
        uploadedFiles.push(`/uploads/compensation/${fileName}`);
      }
    }

    // If new files provided, use them; otherwise keep existing files
    const finalFiles = uploadedFiles.length > 0 ? uploadedFiles : JSON.parse(existingRequest.files || '[]');

    // Process new damage certificate (if provided)
    let certificatePath: string | null = existingRequest.damageCertificate;

    const certificateFile = Array.isArray(files.certificate) ? files.certificate[0] : files.certificate;

    if (certificateFile && 'filepath' in certificateFile) {
      const fileName = path.basename(certificateFile.filepath);
      certificatePath = `/uploads/compensation/${fileName}`;
    }

    // Update compensation request
    const updatedRequest = await prisma.compensationRequest.update({
      where: { id: requestId },
      data: {
        description,
        files: JSON.stringify(finalFiles),
        damageCertificate: certificatePath,
        status: 'Pending', // Reset status to Pending
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      requestId: updatedRequest.id,
      message: 'Compensation request resubmitted successfully',
    });
  } catch (error) {
    console.error('Error resubmitting compensation request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
