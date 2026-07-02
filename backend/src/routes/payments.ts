import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Create Razorpay/Stripe Checkout Session simulation
router.post('/checkout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { bookingId, paymentMethod, amount, gateway } = req.body;

    if (!bookingId || !amount || !gateway) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Simulate Payment Process latency
    const transactionId = `TXN-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const pMethod = paymentMethod || 'UPI';

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: parseFloat(amount),
        paymentMethod: pMethod,
        transactionId,
        gateway,
        status: 'SUCCESS',
        type: 'ADVANCE'
      }
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED'
      }
    });

    await prisma.transaction.create({
      data: {
        bookingId,
        amount: parseFloat(amount),
        type: 'CREDIT',
        description: `Payment success via ${gateway} (${pMethod})`
      }
    });

    res.json({
      message: 'Payment completed successfully (Simulated Gateway)',
      payment,
      transactionId
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment gateway simulation failed' });
  }
});

// Download Invoice API Stub
router.get('/invoice/:bookingId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: {
        car: { include: { brand: true } },
        pickupLocation: true,
        dropLocation: true,
        user: { select: { name: true, email: true, phoneNumber: true } }
      }
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Return detailed JSON billing invoice, client-side can render/print it as PDF
    res.json({
      invoiceNumber: `INV-2026-${booking.id.substring(0, 6).toUpperCase()}`,
      issueDate: booking.createdAt,
      billingTo: {
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phoneNumber
      },
      carDetails: {
        name: `${booking.car.brand.name} ${booking.car.name}`,
        regNumber: booking.car.regNumber,
        transmission: booking.car.transmission,
        fuel: booking.car.fuelType
      },
      duration: {
        pickup: booking.pickupDateTime,
        return: booking.returnDateTime,
        type: booking.durationType
      },
      costSummary: {
        baseAmount: booking.baseAmount,
        taxAmount: booking.taxAmount,
        insuranceAmount: booking.insuranceAmount,
        securityDeposit: booking.securityDeposit,
        discountAmount: booking.discountAmount,
        penaltyFee: booking.penaltyFee,
        lateFee: booking.lateFee,
        finalAmount: booking.finalAmount
      },
      paymentStatus: booking.paymentStatus,
      gstin: '29AABBCCDD1122Z3' // Mock Indian GST identification number
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve invoice' });
  }
});

export default router;
