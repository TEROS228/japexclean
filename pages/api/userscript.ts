import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const filePath = path.join(process.cwd(), 'public', 'rakuten-autocheckout.user.js');
  const content = fs.readFileSync(filePath, 'utf-8');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="rakuten-autocheckout.user.js"');
  res.status(200).send(content);
}
