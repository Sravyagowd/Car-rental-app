import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// Calculate Price Details
router.post('/calculate-price', async (req, res) => {
  try {
    const { carId, pickupDateTime, returnDateTime, durationType, couponCode, driverRequired } = req.body;

    if (!carId || !pickupDateTime || !returnDateTime || !durationType) {
      return res.status(400).json({ message: 'Missing parameters for price calculation' });
    }

    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const start = new Date(pickupDateTime);
    const end = new Date(returnDateTime);
    const diffMs = end.getTime() - start.getTime();

    if (diffMs <= 0) {
      return res.status(400).json({ message: 'Return date must be after pickup date' });
    }

    // Calc base pricing based on duration type
    let baseAmount = 0;
    const hours = diffMs / (1000 * 60 * 60);
    const days = Math.ceil(hours / 24);
    const weeks = Math.ceil(days / 7);
    const months = Math.ceil(days / 30);

    if (durationType === 'HOURLY') {
      baseAmount = Math.ceil(hours) * car.hourlyPrice;
    } else if (durationType === 'DAILY') {
      baseAmount = days * car.dailyPrice;
    } else if (durationType === 'WEEKLY') {
      baseAmount = weeks * car.weeklyPrice;
    } else if (durationType === 'MONTHLY') {
      baseAmount = months * car.monthlyPrice;
    } else {
      // Default to daily
      baseAmount = days * car.dailyPrice;
    }

    // Additional standard charges (Indian Rupees)
    const gstRate = 0.18; // 18% GST in India
    const taxAmount = parseFloat((baseAmount * gstRate).toFixed(2));
    const insuranceAmount = days * 150; // ₹150/day standard insurance
    const securityDeposit = car.securityDeposit; // refundable deposit
    
    let deliveryCharge = car.deliveryCharge;
    let pickupCharge = car.pickupCharge;
    let driverCharge = driverRequired ? (days * car.driverCharge) : 0;

    const subTotal = baseAmount + taxAmount + insuranceAmount + deliveryCharge + pickupCharge + driverCharge;

    // Apply Coupon
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode, isActive: true }
      });
      if (coupon && coupon.expiryDate > new Date() && subTotal >= coupon.minBookingAmount) {
        if (coupon.type === 'FLAT') {
          discountAmount = coupon.value;
        } else if (coupon.type === 'PERCENTAGE') {
          discountAmount = parseFloat(((subTotal * coupon.value) / 100).toFixed(2));
        }
      }
    }

    const finalAmount = subTotal - discountAmount + securityDeposit;

    res.json({
      durationType,
      durationUnits: durationType === 'HOURLY' ? Math.ceil(hours) : days,
      baseAmount,
      taxAmount,
      insuranceAmount,
      securityDeposit,
      deliveryCharge,
      pickupCharge,
      driverCharge,
      discountAmount,
      finalAmount
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Price calculation failed' });
  }
});

// Create a Booking (with double booking check)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      carId,
      pickupLocationId,
      dropLocationId,
      pickupDateTime,
      returnDateTime,
      durationType,
      couponCode,
      driverRequired,
      paymentMethod
    } = req.body;

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // 1. Verify User Document Approved status (Important Indian guideline check)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.idVerificationStatus !== 'APPROVED') {
      return res.status(403).json({
        message: 'Your Driving License and Government ID must be APPROVED by admin before creating a booking.'
      });
    }

    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car || !car.availability || car.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Car is not available for rent' });
    }

    // 2. Prevent Double Bookings (Overlapping checks)
    const start = new Date(pickupDateTime);
    const end = new Date(returnDateTime);

    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        carId,
        status: { in: ['BOOKED', 'CONFIRMED', 'PICKUP_READY', 'ON_RIDE', 'RETURNING'] },
        OR: [
          {
            pickupDateTime: { lte: end },
            returnDateTime: { gte: start }
          }
        ]
      }
    });

    if (overlappingBooking) {
      return res.status(400).json({ message: 'This car is already booked for the selected dates/times' });
    }

    // 3. Re-calculate the prices on server to prevent front-end spoofing
    const startMs = start.getTime();
    const endMs = end.getTime();
    const hours = (endMs - startMs) / (1000 * 60 * 60);
    const days = Math.ceil(hours / 24);
    const weeks = Math.ceil(days / 7);
    const months = Math.ceil(days / 30);

    let baseAmount = 0;
    if (durationType === 'HOURLY') baseAmount = Math.ceil(hours) * car.hourlyPrice;
    else if (durationType === 'DAILY') baseAmount = days * car.dailyPrice;
    else if (durationType === 'WEEKLY') baseAmount = weeks * car.weeklyPrice;
    else if (durationType === 'MONTHLY') baseAmount = months * car.monthlyPrice;
    else baseAmount = days * car.dailyPrice;

    const taxAmount = parseFloat((baseAmount * 0.18).toFixed(2));
    const insuranceAmount = days * 150;
    const securityDeposit = car.securityDeposit;
    const deliveryCharge = car.deliveryCharge;
    const pickupCharge = car.pickupCharge;
    const driverCharge = driverRequired ? (days * car.driverCharge) : 0;
    const subTotal = baseAmount + taxAmount + insuranceAmount + deliveryCharge + pickupCharge + driverCharge;

    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode, isActive: true } });
      if (coupon && coupon.expiryDate > new Date() && subTotal >= coupon.minBookingAmount) {
        if (coupon.type === 'FLAT') discountAmount = coupon.value;
        else if (coupon.type === 'PERCENTAGE') discountAmount = parseFloat(((subTotal * coupon.value) / 100).toFixed(2));
      }
    }

    const finalAmount = subTotal - discountAmount + securityDeposit;

    // Generate random confirmation code/OTPs
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const returnOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const pickupQrCode = `QR-BOOK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Create the booking record
    const booking = await prisma.booking.create({
      data: {
        userId,
        carId,
        pickupLocationId,
        dropLocationId,
        pickupDateTime: start,
        returnDateTime: end,
        durationType,
        status: 'BOOKED',
        pickupQrCode,
        pickupOtp,
        returnOtp,
        baseAmount,
        taxAmount,
        insuranceAmount,
        securityDeposit,
        discountAmount,
        finalAmount,
        paymentStatus: 'PENDING',
        driverRequired: !!driverRequired
      }
    });

    // Simulated immediate payment transaction
    const pMethod = paymentMethod || 'UPI';
    const txnId = `TXN-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    
    // Auto-create payment entry
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: finalAmount,
        paymentMethod: pMethod,
        transactionId: txnId,
        gateway: pMethod === 'CARD' ? 'STRIPE' : 'RAZORPAY',
        status: 'SUCCESS',
        type: 'FULL'
      }
    });

    // Update status to CONFIRMED
    const confirmedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID'
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: { userId, action: 'CREATE_BOOKING', details: `Created booking ${booking.id} for car ${car.name}` }
    });

    // Block dates in blocked calendar
    const currDate = new Date(start);
    while (currDate <= end) {
      const dateStr = currDate.toISOString().split('T')[0];
      await prisma.blockedDate.create({
        data: {
          carId,
          date: dateStr,
          reason: 'BOOKED',
          bookingId: booking.id
        }
      });
      currDate.setDate(currDate.getDate() + 1);
    }

    res.status(201).json(confirmedBooking);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create booking' });
  }
});

// View Customer Bookings
router.get('/my-bookings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        car: {
          include: { brand: true, images: true }
        },
        pickupLocation: true,
        dropLocation: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Get Booking Detail
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        car: {
          include: { brand: true, images: true }
        },
        pickupLocation: true,
        dropLocation: true,
        payments: true,
        user: {
          select: { name: true, email: true, phoneNumber: true }
        }
      }
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    // Check ownership
    if (req.user?.role !== 'ADMIN' && booking.userId !== req.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving booking' });
  }
});

// Extend Rental
router.post('/:id/extend', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { newReturnDateTime } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { car: true }
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== req.user?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const currentReturn = new Date(booking.returnDateTime);
    const extendedReturn = new Date(newReturnDateTime);

    if (extendedReturn <= currentReturn) {
      return res.status(400).json({ message: 'Extension date must be after current return date' });
    }

    // Check if car has overlap on extension period
    const overlap = await prisma.booking.findFirst({
      where: {
        carId: booking.carId,
        id: { not: booking.id },
        status: { in: ['BOOKED', 'CONFIRMED', 'PICKUP_READY', 'ON_RIDE'] },
        pickupDateTime: { lte: extendedReturn },
        returnDateTime: { gte: currentReturn }
      }
    });

    if (overlap) {
      return res.status(400).json({ message: 'Cannot extend. Car is booked by another customer during this period.' });
    }

    // Calculate extension cost
    const diffHours = (extendedReturn.getTime() - currentReturn.getTime()) / (1000 * 60 * 60);
    const extraDays = Math.ceil(diffHours / 24);
    const extensionCost = extraDays * booking.car.dailyPrice;
    const taxOnExtension = extensionCost * 0.18;
    const extraTotal = extensionCost + taxOnExtension;

    // Update booking
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        returnDateTime: extendedReturn,
        baseAmount: booking.baseAmount + extensionCost,
        taxAmount: booking.taxAmount + taxOnExtension,
        finalAmount: booking.finalAmount + extraTotal
      }
    });

    // Create payment entry for extension (simulated PAID)
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: extraTotal,
        paymentMethod: 'UPI',
        transactionId: `EXT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        gateway: 'RAZORPAY',
        status: 'SUCCESS',
        type: 'FINAL'
      }
    });

    // Create blocked dates for extension days
    const currDate = new Date(currentReturn);
    while (currDate <= extendedReturn) {
      const dateStr = currDate.toISOString().split('T')[0];
      // Check if blocked date exists, if not create
      const exists = await prisma.blockedDate.findFirst({
        where: { carId: booking.carId, date: dateStr }
      });
      if (!exists) {
        await prisma.blockedDate.create({
          data: { carId: booking.carId, date: dateStr, reason: 'BOOKED', bookingId: booking.id }
        });
      }
      currDate.setDate(currDate.getDate() + 1);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to extend rental' });
  }
});

// Cancel Booking
router.post('/:id/cancel', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id }
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== req.user?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status !== 'BOOKED' && booking.status !== 'CONFIRMED') {
      return res.status(400).json({ message: 'Only upcoming bookings can be cancelled.' });
    }

    // Cancel booking
    const cancelled = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED'
      }
    });

    // Remove blocked calendar dates
    await prisma.blockedDate.deleteMany({
      where: { bookingId: booking.id }
    });

    // Trigger mock refund payment
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.finalAmount,
        paymentMethod: 'UPI',
        transactionId: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        gateway: 'MOCK',
        status: 'SUCCESS',
        type: 'REFUND'
      }
    });

    res.json({ message: 'Booking cancelled and refund initiated.', booking: cancelled });
  } catch (error) {
    res.status(500).json({ message: 'Cancellation failed' });
  }
});

// Verification & Pickup QR/OTP Check (Driver/Admin/Customer flow)
router.post('/:id/verify-pickup', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { otp, odometer, fuelLevel, damageNotes, signature } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.pickupOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Verification failed.' });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'ON_RIDE',
        pickupOdometer: parseFloat(odometer),
        pickupFuel: parseFloat(fuelLevel),
        pickupDamageNotes: damageNotes || 'No damages found',
        pickupSignature: signature || 'Digitally Signed'
      }
    });

    // Log car status as BOOKED (means on ride)
    await prisma.car.update({
      where: { id: booking.carId },
      data: { status: 'BOOKED' }
    });

    res.json({ message: 'Pickup verification successful. Status: ON_RIDE', booking: updated });
  } catch (error) {
    res.status(500).json({ message: 'Pickup verification failed' });
  }
});

// Return Verification & Bill calculation
router.post('/:id/verify-return', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { otp, odometer, fuelLevel, damageNotes, signature } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { car: true }
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.returnOtp !== otp) {
      return res.status(400).json({ message: 'Invalid Return OTP. Verification failed.' });
    }

    // Calculate penalties/fees
    let penaltyFee = 0;
    let lateFee = 0;

    // Check Odometer overage (Extra KM charge)
    const odoDiff = parseFloat(odometer) - (booking.pickupOdometer || 0);
    const maxKmAvailable = booking.durationType === 'DAILY' ? 250 : 1000; // standard limits
    if (odoDiff > maxKmAvailable) {
      const extraKm = odoDiff - maxKmAvailable;
      penaltyFee = extraKm * booking.car.extraKmCharge;
    }

    // Check return delay
    const actualReturnTime = new Date();
    const scheduledReturnTime = new Date(booking.returnDateTime);
    if (actualReturnTime > scheduledReturnTime) {
      const delayMs = actualReturnTime.getTime() - scheduledReturnTime.getTime();
      const delayHours = Math.ceil(delayMs / (1000 * 60 * 60));
      lateFee = delayHours * booking.car.lateReturnCharge;
    }

    const totalDues = penaltyFee + lateFee;

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'COMPLETED',
        returnOdometer: parseFloat(odometer),
        returnFuel: parseFloat(fuelLevel),
        returnDamageNotes: damageNotes || 'No new damages found',
        returnSignature: signature || 'Customer Digitally Signed',
        penaltyFee,
        lateFee,
        finalAmount: booking.finalAmount + totalDues
      }
    });

    // Mark car available again
    await prisma.car.update({
      where: { id: booking.carId },
      data: { status: 'AVAILABLE' }
    });

    // Release blocked dates
    await prisma.blockedDate.deleteMany({
      where: { bookingId: booking.id }
    });

    // Create payout transaction for security deposit refund
    await prisma.transaction.create({
      data: {
        bookingId: booking.id,
        amount: booking.securityDeposit,
        type: 'DEBIT',
        description: 'Refunded security deposit to customer UPI'
      }
    });

    res.json({
      message: 'Return verification completed. Security deposit refund processed.',
      booking: updated,
      penaltyFee,
      lateFee,
      refundedDeposit: booking.securityDeposit
    });
  } catch (error) {
    res.status(500).json({ message: 'Return verification failed' });
  }
});

export default router;
