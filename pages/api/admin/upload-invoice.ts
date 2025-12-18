import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';

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

    // Parse form data
    const form = new IncomingForm({
      uploadDir: path.join(process.cwd(), 'public', 'uploads', 'invoices'),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filename: (name, ext, part) => {
        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        return `invoice_${timestamp}_${random}${ext}`;
      }
    });

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'invoices');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const [fields, files] = await form.parse(req);

    const packageId = Array.isArray(fields.packageId) ? fields.packageId[0] : fields.packageId;
    const invoiceFile = Array.isArray(files.invoice) ? files.invoice[0] : files.invoice;

    if (!packageId || !invoiceFile) {
      return res.status(400).json({ error: 'Package ID and invoice file required' });
    }

    // Get the uploaded file path
    const filePath = invoiceFile.filepath;
    const fileName = path.basename(filePath);
    const publicPath = `/uploads/invoices/${fileName}`;

    // Update package with invoice path
    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: { invoice: publicPath }
    });

    res.status(200).json({
      success: true,
      invoice: publicPath,
      package: updatedPackage
    });

  } catch (error: any) {
    console.error('Error uploading invoice:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
