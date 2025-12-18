import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';
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

    const packageId = Array.isArray(fields.packageId) ? fields.packageId[0] : fields.packageId;
    const carrier = Array.isArray(fields.carrier) ? fields.carrier[0] : fields.carrier;
    const compensationType = Array.isArray(fields.compensationType) ? fields.compensationType[0] : fields.compensationType;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
    const selectedItems = Array.isArray(fields.selectedItems) ? fields.selectedItems[0] : fields.selectedItems;

    if (!packageId || !description) {
      return res.status(400).json({ error: 'Package ID and description are required' });
    }

    // Verify package belongs to user
    const pkg = await prisma.package.findFirst({
      where: {
        id: packageId,
        userId: userId,
      },
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Process uploaded files
    const uploadedFiles: string[] = [];
    const filesArray = Array.isArray(files.files) ? files.files : files.files ? [files.files] : [];

    for (const file of filesArray) {
      if (file && 'filepath' in file) {
        const fileName = path.basename(file.filepath);
        uploadedFiles.push(`/uploads/compensation/${fileName}`);
      }
    }

    // Process damage certificate (REQUIRED for EMS only)
    let certificatePath: string | null = null;

    if (carrier === 'ems') {
      const certificateFile = Array.isArray(files.certificate) ? files.certificate[0] : files.certificate;

      if (!certificateFile || !('filepath' in certificateFile)) {
        return res.status(400).json({ error: 'Damage certificate is required for Japan Post EMS' });
      }

      const fileName = path.basename(certificateFile.filepath);
      certificatePath = `/uploads/compensation/${fileName}`;
    }

    // Create compensation request record
    const compensationRequest = await prisma.compensationRequest.create({
      data: {
        userId,
        packageId,
        selectedPackageIds: selectedItems || null,
        compensationType: compensationType || 'replace',
        description,
        files: JSON.stringify(uploadedFiles),
        damageCertificate: certificatePath,
        status: 'Pending',
      },
    });

    // Получаем информацию о пользователе и посылке
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    // Отправляем Telegram уведомление
    const telegramMessage = `
💰 <b>NEW COMPENSATION REQUEST</b>

👤 <b>User:</b> ${user?.email}
📦 <b>Package ID:</b> ${packageId}
🔄 <b>Type:</b> ${compensationType || 'replace'}
📝 <b>Description:</b> ${description}
📎 <b>Files:</b> ${uploadedFiles.length} attached
${certificatePath ? '📜 <b>Certificate:</b> Attached' : ''}

<i>Please review the compensation request in the admin panel.</i>
    `.trim();

    await sendTelegramNotification(telegramMessage);

    // Создаем уведомление для админа
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true }
    });

    for (const admin of adminUsers) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'compensation_request',
          title: '💰 New Compensation Request',
          message: `${user?.email} submitted a compensation request`
        }
      });
    }

    return res.status(200).json({
      success: true,
      requestId: compensationRequest.id,
      message: 'Compensation request submitted successfully',
    });
  } catch (error) {
    console.error('Error processing compensation request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
