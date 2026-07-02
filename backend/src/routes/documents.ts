import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Upload Driving License or Gov ID Documents
router.post('/upload', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { type, fileUrl } = req.body;
    const userId = req.user?.id;

    if (!type || !fileUrl || !userId) {
      return res.status(400).json({ message: 'Document type and file URL are required' });
    }

    // Create document record
    const document = await prisma.userDocument.create({
      data: {
        userId,
        type,
        fileUrl,
        status: 'PENDING'
      }
    });

    // Update user status to pending verification
    await prisma.user.update({
      where: { id: userId },
      data: { idVerificationStatus: 'PENDING' }
    });

    await prisma.activityLog.create({
      data: { userId, action: 'UPLOAD_DOCUMENT', details: `Uploaded ${type}` }
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Document upload failed' });
  }
});

// Admin approves/rejects documents
router.post('/verify-document/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { status, comments } = req.body; // "APPROVED", "REJECTED"
    const docId = req.params.id;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const doc = await prisma.userDocument.update({
      where: { id: docId },
      data: { status, comments }
    });

    // Check if user has both front, back, and selfie approved to approve user completely
    const allDocs = await prisma.userDocument.findMany({
      where: { userId: doc.userId }
    });

    const isFullyApproved = allDocs.filter(d => d.status === 'APPROVED').length >= 3;
    const hasRejections = allDocs.some(d => d.status === 'REJECTED');

    let userStatus = 'PENDING';
    if (isFullyApproved) userStatus = 'APPROVED';
    else if (hasRejections) userStatus = 'REJECTED';

    await prisma.user.update({
      where: { id: doc.userId },
      data: {
        idVerificationStatus: userStatus,
        idVerificationComments: comments
      }
    });

    // Create Notification for the customer
    await prisma.notification.create({
      data: {
        userId: doc.userId,
        title: `Verification Update: ${status}`,
        message: status === 'APPROVED' 
          ? 'Your driving license documents have been approved. You are now cleared to book cars!'
          : `Your document verification was rejected: ${comments || 'Please re-upload clear images.'}`,
        channel: 'IN_APP'
      }
    });

    res.json({ message: 'Document verification updated', document: doc });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update document verification' });
  }
});

export default router;
