import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Enable admin check for all endpoints in this router
router.use(authenticateToken, requireRole(['ADMIN']));

// 1. Dashboard Analytics & Stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalEarningsResult = await prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });
    const totalEarnings = totalEarningsResult._sum.amount || 0;

    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalCars = await prisma.car.count();
    
    // Fleet status counts
    const availableCars = await prisma.car.count({ where: { status: 'AVAILABLE' } });
    const bookedCars = await prisma.car.count({ where: { status: 'BOOKED' } });
    const maintenanceCars = await prisma.car.count({ where: { status: 'MAINTENANCE' } });

    // Bookings counts
    const totalBookings = await prisma.booking.count();
    const activeBookings = await prisma.booking.count({
      where: { status: { in: ['CONFIRMED', 'PICKUP_READY', 'ON_RIDE', 'RETURNING'] } }
    });
    const completedBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const cancelledBookings = await prisma.booking.count({ where: { status: 'CANCELLED' } });
    const pendingDocuments = await prisma.user.count({ where: { idVerificationStatus: 'PENDING' } });

    // Fleet utilization calculation
    const fleetUtilization = totalCars > 0 ? parseFloat(((bookedCars / totalCars) * 100).toFixed(1)) : 0;

    // Monthly Earnings chart data simulation (realistic values)
    const monthlyEarnings = [
      { name: 'Jan', earnings: 45000 },
      { name: 'Feb', earnings: 52000 },
      { name: 'Mar', earnings: 61000 },
      { name: 'Apr', earnings: 58000 },
      { name: 'May', earnings: 70000 },
      { name: 'Jun', earnings: totalEarnings > 0 ? Math.round(totalEarnings * 0.4) : 85000 }
    ];

    res.json({
      totalEarnings,
      totalCustomers,
      totalCars,
      availableCars,
      bookedCars,
      maintenanceCars,
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      pendingDocuments,
      fleetUtilization,
      monthlyEarnings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving analytics data' });
  }
});

// 2. Car CRUD
// Add Car
router.post('/cars', async (req, res) => {
  try {
    const {
      name,
      brandId,
      model,
      year,
      fuelType,
      transmission,
      seating,
      mileage,
      color,
      regNumber,
      locationId,
      hourlyPrice,
      dailyPrice,
      weeklyPrice,
      monthlyPrice,
      securityDeposit,
      extraKmCharge,
      lateReturnCharge,
      cleaningCharge,
      driverCharge,
      deliveryCharge,
      pickupCharge,
      insuranceExpiry,
      rcExpiry,
      pollutionExpiry,
      fitnessExpiry,
      images // Expecting array of image URLs
    } = req.body;

    const car = await prisma.car.create({
      data: {
        name,
        brandId,
        model,
        year: parseInt(year),
        fuelType,
        transmission,
        seating: parseInt(seating),
        mileage: parseFloat(mileage),
        color,
        regNumber,
        locationId,
        hourlyPrice: parseFloat(hourlyPrice),
        dailyPrice: parseFloat(dailyPrice),
        weeklyPrice: parseFloat(weeklyPrice),
        monthlyPrice: parseFloat(monthlyPrice),
        securityDeposit: parseFloat(securityDeposit || 3000),
        extraKmCharge: parseFloat(extraKmCharge || 10),
        lateReturnCharge: parseFloat(lateReturnCharge || 200),
        cleaningCharge: parseFloat(cleaningCharge || 300),
        driverCharge: parseFloat(driverCharge || 500),
        deliveryCharge: parseFloat(deliveryCharge || 250),
        pickupCharge: parseFloat(pickupCharge || 250),
        insuranceExpiry,
        rcExpiry,
        pollutionExpiry,
        fitnessExpiry,
        status: 'AVAILABLE'
      }
    });

    // Handle images array
    if (images && Array.isArray(images) && images.length > 0) {
      await prisma.carImage.createMany({
        data: images.map((url, index) => ({
          carId: car.id,
          url,
          orderIndex: index,
          isCover: index === 0
        }))
      });
    }

    res.status(201).json(car);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to add car' });
  }
});

// Edit Car
router.put('/cars/:id', async (req, res) => {
  try {
    const {
      name,
      model,
      year,
      fuelType,
      transmission,
      seating,
      mileage,
      color,
      regNumber,
      locationId,
      hourlyPrice,
      dailyPrice,
      weeklyPrice,
      monthlyPrice,
      securityDeposit,
      extraKmCharge,
      lateReturnCharge,
      cleaningCharge,
      driverCharge,
      deliveryCharge,
      pickupCharge,
      status,
      insuranceExpiry,
      rcExpiry,
      pollutionExpiry,
      fitnessExpiry,
      images // Expecting final array of URLs or update object
    } = req.body;

    const car = await prisma.car.update({
      where: { id: req.params.id },
      data: {
        name,
        model,
        year: year ? parseInt(year) : undefined,
        fuelType,
        transmission,
        seating: seating ? parseInt(seating) : undefined,
        mileage: mileage ? parseFloat(mileage) : undefined,
        color,
        regNumber,
        locationId,
        hourlyPrice: hourlyPrice ? parseFloat(hourlyPrice) : undefined,
        dailyPrice: dailyPrice ? parseFloat(dailyPrice) : undefined,
        weeklyPrice: weeklyPrice ? parseFloat(weeklyPrice) : undefined,
        monthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : undefined,
        securityDeposit: securityDeposit ? parseFloat(securityDeposit) : undefined,
        extraKmCharge: extraKmCharge ? parseFloat(extraKmCharge) : undefined,
        lateReturnCharge: lateReturnCharge ? parseFloat(lateReturnCharge) : undefined,
        cleaningCharge: cleaningCharge ? parseFloat(cleaningCharge) : undefined,
        driverCharge: driverCharge ? parseFloat(driverCharge) : undefined,
        deliveryCharge: deliveryCharge ? parseFloat(deliveryCharge) : undefined,
        pickupCharge: pickupCharge ? parseFloat(pickupCharge) : undefined,
        status,
        insuranceExpiry,
        rcExpiry,
        pollutionExpiry,
        fitnessExpiry
      }
    });

    // Update images if provided
    if (images && Array.isArray(images)) {
      await prisma.carImage.deleteMany({ where: { carId: car.id } });
      await prisma.carImage.createMany({
        data: images.map((url, index) => ({
          carId: car.id,
          url,
          orderIndex: index,
          isCover: index === 0
        }))
      });
    }

    res.json(car);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update car details' });
  }
});

// Delete Car
router.delete('/cars/:id', async (req, res) => {
  try {
    await prisma.car.delete({ where: { id: req.params.id } });
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete car' });
  }
});

// 3. Admin view of bookings
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        car: { include: { brand: true } },
        user: { select: { name: true, email: true, phoneNumber: true } },
        pickupLocation: true,
        dropLocation: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve bookings' });
  }
});

// 4. Customer Management
router.get('/customers', async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: {
        documents: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve customers' });
  }
});

// Update Customer verification comments or block status
router.post('/customers/:id/action', async (req, res) => {
  try {
    const { action } = req.body; // e.g. "BLOCK" or "UNBLOCK"
    let status = 'APPROVED';
    if (action === 'BLOCK') {
      status = 'REJECTED';
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        idVerificationStatus: status,
        idVerificationComments: action === 'BLOCK' ? 'Blocked by administrator' : 'Restored by administrator'
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to perform action on user' });
  }
});

// 5. Block / Unblock calendar dates directly
router.post('/cars/:id/block-dates', async (req, res) => {
  try {
    const { dates, reason } = req.body; // array of "YYYY-MM-DD"
    const carId = req.params.id;

    if (!dates || !Array.isArray(dates)) {
      return res.status(400).json({ message: 'Dates array required' });
    }

    const created = await Promise.all(
      dates.map(date =>
        prisma.blockedDate.create({
          data: { carId, date, reason: reason || 'BLOCKED' }
        })
      )
    );

    res.json({ message: 'Dates blocked successfully', created });
  } catch (error) {
    res.status(500).json({ message: 'Failed to block dates' });
  }
});

router.post('/cars/:id/unblock-dates', async (req, res) => {
  try {
    const { dates } = req.body; // array of "YYYY-MM-DD"
    const carId = req.params.id;

    await prisma.blockedDate.deleteMany({
      where: {
        carId,
        date: { in: dates }
      }
    });

    res.json({ message: 'Dates unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unblock dates' });
  }
});

// 6. Coupon CRUD
router.post('/coupons', async (req, res) => {
  try {
    const { code, type, value, expiryDate, minBookingAmount, usageLimit } = req.body;
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        expiryDate: new Date(expiryDate),
        minBookingAmount: parseFloat(minBookingAmount || 0),
        usageLimit: parseInt(usageLimit || 100)
      }
    });
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create coupon' });
  }
});

router.get('/coupons', async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { expiryDate: 'asc' } });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve coupons' });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete coupon' });
  }
});

export default router;
