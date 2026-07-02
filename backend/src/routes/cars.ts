import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Get Cars with Search, Filter & Sort
router.get('/', async (req, res) => {
  try {
    const {
      brand,
      fuel,
      transmission,
      seats,
      minPrice,
      maxPrice,
      rating,
      locationId,
      search,
      sortBy,
      isAC,
      isSUV,
      isLuxury,
      isHatchback,
      isSedan,
      isElectric
    } = req.query;

    const where: any = {
      availability: true,
      status: 'AVAILABLE'
    };

    // Brand filtering
    if (brand) {
      where.brand = { name: String(brand) };
    }

    // Fuel filtering
    if (fuel) {
      where.fuelType = String(fuel).toUpperCase();
    }

    // Transmission filtering
    if (transmission) {
      where.transmission = String(transmission).toUpperCase();
    }

    // Seats filtering
    if (seats) {
      where.seating = parseInt(String(seats), 10);
    }

    // Location filtering
    if (locationId) {
      where.locationId = String(locationId);
    }

    // Daily Price filtering (Indian standard values)
    if (minPrice || maxPrice) {
      where.dailyPrice = {};
      if (minPrice) where.dailyPrice.gte = parseFloat(String(minPrice));
      if (maxPrice) where.dailyPrice.lte = parseFloat(String(maxPrice));
    }

    // Rating filtering
    if (rating) {
      where.rating = { gte: parseFloat(String(rating)) };
    }

    // Search query (matches car name, model, brand name or location name)
    if (search) {
      const searchStr = String(search).toLowerCase();
      where.OR = [
        { name: { contains: searchStr } },
        { model: { contains: searchStr } },
        { brand: { name: { contains: searchStr } } },
        { location: { name: { contains: searchStr } } }
      ];
    }

    // Tag filtering mapping (AC, SUV, Hatchback, Sedan, Electric, etc. in car names or descriptions)
    if (isAC === 'true') {
      where.OR = where.OR || [];
      where.OR.push({ name: { contains: 'AC' } }, { model: { contains: 'AC' } }, { hourlyPrice: { gte: 0 } }); // most are AC
    }
    if (isSUV === 'true') {
      where.OR = where.OR || [];
      where.OR.push({ name: { in: ['Nexon', 'Creta', 'Punch', 'XUV700', 'Bolero Neo', 'Sonet'] } });
    }
    if (isHatchback === 'true') {
      where.OR = where.OR || [];
      where.OR.push({ name: { in: ['Swift', 'Baleno', 'Glanza', 'i20'] } });
    }
    if (isElectric === 'true') {
      where.fuelType = 'ELECTRIC';
    }

    // Sorting options
    let orderBy: any = {};
    if (sortBy === 'price_low_high') {
      orderBy = { dailyPrice: 'asc' };
    } else if (sortBy === 'price_high_low') {
      orderBy = { dailyPrice: 'desc' };
    } else if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sortBy === 'latest') {
      orderBy = { year: 'desc' };
    } else {
      // Default sort
      orderBy = { rating: 'desc' };
    }

    const cars = await prisma.car.findMany({
      where,
      orderBy,
      include: {
        brand: true,
        location: true,
        images: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    res.json(cars);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error searching cars' });
  }
});

// AI Car Recommendations Endpoint
router.get('/recommendations', async (req, res) => {
  try {
    // Get high-rated cars as recommendation baseline
    const recommendations = await prisma.car.findMany({
      where: {
        availability: true,
        status: 'AVAILABLE'
      },
      take: 4,
      orderBy: [
        { rating: 'desc' }
      ],
      include: {
        brand: true,
        location: true,
        images: true
      }
    });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving recommendations' });
  }
});

// Get Brands
router.get('/brands', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { cars: true }
        }
      }
    });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving brands' });
  }
});

// Get Locations
router.get('/locations', async (req, res) => {
  try {
    const locations = await prisma.location.findMany();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving locations' });
  }
});

// Get Car Details with reviews and blocked calendar dates
router.get('/:id', async (req, res) => {
  try {
    const car = await prisma.car.findUnique({
      where: { id: req.params.id },
      include: {
        brand: true,
        location: true,
        images: {
          orderBy: { orderIndex: 'asc' }
        },
        blockedDates: true,
        reviews: {
          include: {
            user: {
              select: { name: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json(car);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving car details' });
  }
});

// Submit a Review
router.post('/:id/reviews', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { rating, comment, bookingId } = req.body;
    const userId = req.user?.id;
    const carId = req.params.id;

    if (!rating || !comment || !bookingId || !userId) {
      return res.status(400).json({ message: 'Rating, comment, and booking ID are required' });
    }

    // Verify booking belongs to user, matches car, and is completed
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: userId,
        carId: carId,
        status: 'COMPLETED'
      }
    });

    if (!booking) {
      return res.status(400).json({ message: 'You can only review cars you have rented and completed trips for.' });
    }

    // Verify no review already exists for this booking
    const existingReview = await prisma.review.findFirst({
      where: { bookingId }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        carId,
        userId,
        rating: parseFloat(rating),
        comment
      },
      include: {
        user: {
          select: { name: true, avatarUrl: true }
        }
      }
    });

    // Update aggregate rating of the car
    const allCarReviews = await prisma.review.findMany({
      where: { carId }
    });

    const averageRating = allCarReviews.reduce((sum, r) => sum + r.rating, 0) / allCarReviews.length;

    await prisma.car.update({
      where: { id: carId },
      data: { rating: parseFloat(averageRating.toFixed(1)) }
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting review' });
  }
});

// Like a Review
router.post('/:id/reviews/:reviewId/like', authenticateToken, async (req, res) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.reviewId },
      data: { likes: { increment: 1 } }
    });
    res.json({ likes: review.likes });
  } catch (error) {
    res.status(500).json({ message: 'Error liking review' });
  }
});

export default router;
