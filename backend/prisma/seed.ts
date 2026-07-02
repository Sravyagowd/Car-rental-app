import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean database
  await prisma.activityLog.deleteMany({});
  await prisma.fleetLog.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.blockedDate.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.carImage.deleteMany({});
  await prisma.car.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.userDocument.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@carrent.in',
      name: 'Rajesh Kumar (Owner)',
      passwordHash,
      role: 'ADMIN',
      phoneNumber: '+919876543210',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      idVerificationStatus: 'APPROVED'
    }
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@gmail.com',
      name: 'Amit Sharma',
      passwordHash,
      role: 'CUSTOMER',
      phoneNumber: '+919988776655',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      idVerificationStatus: 'APPROVED'
    }
  });

  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@carrent.in',
      name: 'Ramesh Singh',
      passwordHash,
      role: 'DRIVER',
      phoneNumber: '+919123456789',
      avatarUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150',
      idVerificationStatus: 'APPROVED'
    }
  });

  // Create associated Driver model
  const driver = await prisma.driver.create({
    data: {
      userId: driverUser.id,
      licenseNumber: 'DL-1420230098765',
      availabilityStatus: 'AVAILABLE'
    }
  });

  // 3. Create Documents for Customer
  await prisma.userDocument.createMany({
    data: [
      {
        userId: customer.id,
        type: 'DRIVING_LICENSE_FRONT',
        fileUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=600',
        status: 'APPROVED',
        comments: 'Verified by system OCR'
      },
      {
        userId: customer.id,
        type: 'DRIVING_LICENSE_BACK',
        fileUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=600',
        status: 'APPROVED',
        comments: 'Verified by system OCR'
      },
      {
        userId: customer.id,
        type: 'DRIVING_LICENSE_SELFIE',
        fileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        status: 'APPROVED',
        comments: 'Selfie matched'
      }
    ]
  });

  // 4. Create Brands (Indian Market Common Brands)
  const brandsData = [
    { name: 'Maruti Suzuki', logoUrl: 'https://companieslogo.com/img/orig/MSIL.NS-cde813a3.png?t=1602931444' },
    { name: 'Tata Motors', logoUrl: 'https://companieslogo.com/img/orig/TATAMOTORS.NS-59b489a8.png?t=1612543455' },
    { name: 'Hyundai', logoUrl: 'https://companieslogo.com/img/orig/HYMTF-cf9b0716.png?t=1648074987' },
    { name: 'Mahindra', logoUrl: 'https://companieslogo.com/img/orig/M&M.NS-a3f1246c.png?t=1602931443' },
    { name: 'Kia', logoUrl: 'https://companieslogo.com/img/orig/000270.KS-fcc49f48.png?t=1604130095' },
    { name: 'Toyota', logoUrl: 'https://companieslogo.com/img/orig/TM-1c52b2c9.png?t=1602931443' },
    { name: 'Honda', logoUrl: 'https://companieslogo.com/img/orig/HMC-45184dfb.png?t=1602931443' },
    { name: 'Nissan', logoUrl: 'https://companieslogo.com/img/orig/NSANY-3fa4227f.png?t=1604245781' },
    { name: 'Renault', logoUrl: 'https://companieslogo.com/img/orig/RNO.PA-8422ce44.png?t=1611142512' }
  ];

  const brands: Record<string, string> = {};
  for (const b of brandsData) {
    const created = await prisma.brand.create({
      data: { name: b.name, logoUrl: b.logoUrl }
    });
    brands[b.name] = created.id;
  }

  // 5. Create Locations
  const locationsData = [
    { name: 'Indiranagar, Bengaluru', address: '100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038', latitude: 12.971899, longitude: 77.641151 },
    { name: 'Delhi Airport (DEL) T3', address: 'Indira Gandhi International Airport, New Delhi, Delhi 110037', latitude: 28.556162, longitude: 77.100281 },
    { name: 'Andheri East, Mumbai', address: 'Metro Station Area, Andheri Kurla Rd, Mumbai, Maharashtra 400069', latitude: 19.115814, longitude: 72.871891 },
    { name: 'Madhapur, Hyderabad', address: 'Hitech City Rd, Madhapur, Hyderabad, Telangana 500081', latitude: 17.448293, longitude: 78.374185 },
    { name: 'Guindy, Chennai', address: 'Near Mount Road, Guindy, Chennai, Tamil Nadu 600032', latitude: 13.0067, longitude: 80.2206 }
  ];

  const locations: Record<string, string> = {};
  for (const loc of locationsData) {
    const created = await prisma.location.create({
      data: loc
    });
    locations[loc.name] = created.id;
  }

  // 6. Create Cars (Affordable & Common Indian Rental Cars)
  const carsData = [
    {
      name: 'Swift',
      brand: 'Maruti Suzuki',
      model: 'VXI',
      year: 2023,
      fuelType: 'PETROL',
      transmission: 'MANUAL',
      seating: 5,
      mileage: 22.38,
      color: 'Solid Red',
      regNumber: 'KA-03-MM-1234',
      hourlyPrice: 90,
      dailyPrice: 1399,
      weeklyPrice: 8500,
      monthlyPrice: 28000,
      securityDeposit: 3000,
      locationName: 'Indiranagar, Bengaluru',
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
      description: 'The Maruti Swift is a compact hatchback perfect for city drives. It offers amazing fuel economy and is easy to park in crowded Indian streets.'
    },
    {
      name: 'Baleno',
      brand: 'Maruti Suzuki',
      model: 'Zeta',
      year: 2022,
      fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      seating: 5,
      mileage: 22.94,
      color: 'Nexa Blue',
      regNumber: 'KA-51-AB-5678',
      hourlyPrice: 110,
      dailyPrice: 1699,
      weeklyPrice: 9900,
      monthlyPrice: 32000,
      securityDeposit: 3000,
      locationName: 'Indiranagar, Bengaluru',
      imageUrl: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&auto=format&fit=crop&q=80',
      description: 'Premium hatchback offering spacious cabins, advanced suspension, and smooth automatic transmission for a premium city drive.'
    },
    {
      name: 'Nexon',
      brand: 'Tata Motors',
      model: 'Creative AMT',
      year: 2023,
      fuelType: 'DIESEL',
      transmission: 'AUTOMATIC',
      seating: 5,
      mileage: 23.2,
      color: 'Flame Red',
      regNumber: 'DL-8C-AA-9999',
      hourlyPrice: 140,
      dailyPrice: 2199,
      weeklyPrice: 13000,
      monthlyPrice: 45000,
      securityDeposit: 5000,
      locationName: 'Delhi Airport (DEL) T3',
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80',
      description: '5-star safety rated compact SUV. High ground clearance, superb punchy diesel engine, and standard drive modes (City/Eco/Sport).'
    },
    {
      name: 'Punch',
      brand: 'Tata Motors',
      model: 'Adventure',
      year: 2022,
      fuelType: 'PETROL',
      transmission: 'MANUAL',
      seating: 5,
      mileage: 20.09,
      color: 'Atomic Orange',
      regNumber: 'DL-3C-BY-1122',
      hourlyPrice: 95,
      dailyPrice: 1499,
      weeklyPrice: 8900,
      monthlyPrice: 29000,
      securityDeposit: 3000,
      locationName: 'Delhi Airport (DEL) T3',
      imageUrl: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&auto=format&fit=crop&q=80',
      description: 'India\'s highly popular micro SUV. Compact yet commanding drive position, high safety rating, and very rugged for Indian potholes.'
    },
    {
      name: 'Creta',
      brand: 'Hyundai',
      model: 'SX IVT',
      year: 2023,
      fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      seating: 5,
      mileage: 16.8,
      color: 'Polar White',
      regNumber: 'MH-02-CP-8822',
      hourlyPrice: 160,
      dailyPrice: 2599,
      weeklyPrice: 15500,
      monthlyPrice: 52000,
      securityDeposit: 5000,
      locationName: 'Andheri East, Mumbai',
      imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
      description: 'The ultimate mid-size SUV of India. Panoramic sunroof, ultra-premium seats, smooth automatic gearbox, and dominant road presence.'
    },
    {
      name: 'i20',
      brand: 'Hyundai',
      model: 'Asta',
      year: 2022,
      fuelType: 'PETROL',
      transmission: 'MANUAL',
      seating: 5,
      mileage: 20.3,
      color: 'Fiery Red',
      regNumber: 'MH-03-BL-4500',
      hourlyPrice: 100,
      dailyPrice: 1599,
      weeklyPrice: 9500,
      monthlyPrice: 30000,
      securityDeposit: 3000,
      locationName: 'Andheri East, Mumbai',
      imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80',
      description: 'Premium sporty hatchback. Offers the latest tech dashboard, Bose speaker simulation, and punchy engine for Highway trips.'
    },
    {
      name: 'XUV700',
      brand: 'Mahindra',
      model: 'MX Base',
      year: 2022,
      fuelType: 'DIESEL',
      transmission: 'MANUAL',
      seating: 5,
      mileage: 15.5,
      color: 'Everest White',
      regNumber: 'AP-09-XX-7000',
      hourlyPrice: 180,
      dailyPrice: 2799,
      weeklyPrice: 16900,
      monthlyPrice: 59000,
      securityDeposit: 7000,
      locationName: 'Madhapur, Hyderabad',
      imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80',
      description: 'Spacious and powerful base model of India\'s trending SUV. Massive engine power, stable high-speed dynamics, and immense boot space.'
    },
    {
      name: 'Bolero Neo',
      brand: 'Mahindra',
      model: 'N10',
      year: 2022,
      fuelType: 'DIESEL',
      transmission: 'MANUAL',
      seating: 7,
      mileage: 17.2,
      color: 'Rocky Beige',
      regNumber: 'TS-07-ZZ-1234',
      hourlyPrice: 130,
      dailyPrice: 1999,
      weeklyPrice: 11900,
      monthlyPrice: 38000,
      securityDeposit: 4000,
      locationName: 'Madhapur, Hyderabad',
      imageUrl: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=600&auto=format&fit=crop&q=80',
      description: 'Tough body-on-frame 7-seater SUV. Excellent for large families heading out on rough rural or state highways.'
    },
    {
      name: 'Sonet',
      brand: 'Kia',
      model: 'HTX',
      year: 2023,
      fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      seating: 5,
      mileage: 18.2,
      color: 'Gravity Grey',
      regNumber: 'TN-01-AB-1212',
      hourlyPrice: 120,
      dailyPrice: 1799,
      weeklyPrice: 10900,
      monthlyPrice: 35000,
      securityDeposit: 3500,
      locationName: 'Guindy, Chennai',
      imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&auto=format&fit=crop&q=80',
      description: 'Feature-rich compact SUV. Offers ventilated seats, smart air purifier, and dual clutch automatic transmission.'
    },
    {
      name: 'Glanza',
      brand: 'Toyota',
      model: 'G',
      year: 2023,
      fuelType: 'PETROL',
      transmission: 'MANUAL',
      seating: 5,
      mileage: 22.3,
      color: 'Insta Blue',
      regNumber: 'TN-02-CD-4321',
      hourlyPrice: 105,
      dailyPrice: 1599,
      weeklyPrice: 9400,
      monthlyPrice: 31000,
      securityDeposit: 3000,
      locationName: 'Guindy, Chennai',
      imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&auto=format&fit=crop&q=80',
      description: 'Toyota\'s reliable hatchback. Offers legendary Toyota service reliability, class-leading mileage, and smooth city driving.'
    }
  ];

  for (const car of carsData) {
    const brandId = brands[car.brand];
    const locationId = locations[car.locationName];
    if (!brandId || !locationId) continue;

    const createdCar = await prisma.car.create({
      data: {
        name: car.name,
        brandId,
        model: car.model,
        year: car.year,
        fuelType: car.fuelType,
        transmission: car.transmission,
        seating: car.seating,
        mileage: car.mileage,
        color: car.color,
        regNumber: car.regNumber,
        locationId,
        hourlyPrice: car.hourlyPrice,
        dailyPrice: car.dailyPrice,
        weeklyPrice: car.weeklyPrice,
        monthlyPrice: car.monthlyPrice,
        securityDeposit: car.securityDeposit,
        availability: true,
        status: 'AVAILABLE',
        insuranceExpiry: '2027-05-15',
        rcExpiry: '2037-05-15',
        pollutionExpiry: '2026-12-15',
        fitnessExpiry: '2037-05-15'
      }
    });

    // Create cover image and extra image
    await prisma.carImage.createMany({
      data: [
        {
          carId: createdCar.id,
          url: car.imageUrl,
          orderIndex: 0,
          isCover: true
        },
        {
          carId: createdCar.id,
          url: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?w=600',
          orderIndex: 1,
          isCover: false
        }
      ]
    });

    // Also block some dates for maintenance/demo
    if (car.name === 'Punch') {
      await prisma.blockedDate.create({
        data: {
          carId: createdCar.id,
          date: '2026-07-10',
          reason: 'MAINTENANCE'
        }
      });
    }
  }

  // 7. Create Coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME500',
        type: 'FLAT',
        value: 500,
        expiryDate: new Date('2026-12-31'),
        minBookingAmount: 2000
      },
      {
        code: 'FESTIVAL15',
        type: 'PERCENTAGE',
        value: 15,
        expiryDate: new Date('2026-10-31'),
        minBookingAmount: 4000
      },
      {
        code: 'MONSOON10',
        type: 'PERCENTAGE',
        value: 10,
        expiryDate: new Date('2026-08-31'),
        minBookingAmount: 1500
      }
    ]
  });

  // 8. Create a past and current booking for seed demo
  const testCar = await prisma.car.findFirst({ where: { name: 'Swift' } });
  const testLoc = await prisma.location.findFirst();

  if (testCar && testLoc) {
    // Past Completed Booking
    const pastBooking = await prisma.booking.create({
      data: {
        userId: customer.id,
        carId: testCar.id,
        pickupLocationId: testLoc.id,
        dropLocationId: testLoc.id,
        pickupDateTime: new Date('2026-06-15T09:00:00Z'),
        returnDateTime: new Date('2026-06-17T18:00:00Z'),
        durationType: 'DAILY',
        status: 'COMPLETED',
        baseAmount: 2798,
        taxAmount: 503,
        insuranceAmount: 400,
        securityDeposit: 3000,
        discountAmount: 500,
        finalAmount: 6201,
        paymentStatus: 'PAID',
        pickupOdometer: 12450.5,
        pickupFuel: 90,
        returnOdometer: 12720.2,
        returnFuel: 85,
        createdAt: new Date('2026-06-10T10:00:00Z'),
        updatedAt: new Date('2026-06-17T18:30:00Z')
      }
    });

    await prisma.payment.create({
      data: {
        bookingId: pastBooking.id,
        amount: 6201,
        paymentMethod: 'UPI',
        transactionId: 'TXN-9876543210',
        gateway: 'RAZORPAY',
        status: 'SUCCESS',
        type: 'FULL'
      }
    });

    await prisma.transaction.create({
      data: {
        bookingId: pastBooking.id,
        amount: 6201,
        type: 'CREDIT',
        description: 'Booking payment received via Razorpay UPI'
      }
    });

    // Create Review
    await prisma.review.create({
      data: {
        bookingId: pastBooking.id,
        carId: testCar.id,
        userId: customer.id,
        rating: 4.8,
        comment: 'Car was in superb condition, mileage was awesome. Seamless pickup at Indiranagar branch. Highly recommended!',
        ownerReply: 'Thank you Amit! We look forward to serving you again.',
        likes: 5
      }
    });

    // Upcoming Confirmed Booking
    const upcomingBooking = await prisma.booking.create({
      data: {
        userId: customer.id,
        carId: testCar.id,
        pickupLocationId: testLoc.id,
        dropLocationId: testLoc.id,
        pickupDateTime: new Date('2026-07-15T09:00:00Z'),
        returnDateTime: new Date('2026-07-18T18:00:00Z'),
        durationType: 'DAILY',
        status: 'CONFIRMED',
        baseAmount: 4197,
        taxAmount: 755,
        insuranceAmount: 600,
        securityDeposit: 3000,
        discountAmount: 0,
        finalAmount: 8552,
        paymentStatus: 'PAID',
        pickupOtp: '5829',
        returnOtp: '9182',
        createdAt: new Date()
      }
    });

    await prisma.payment.create({
      data: {
        bookingId: upcomingBooking.id,
        amount: 8552,
        paymentMethod: 'CARD',
        transactionId: 'TXN-8765432109',
        gateway: 'STRIPE',
        status: 'SUCCESS',
        type: 'FULL'
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
