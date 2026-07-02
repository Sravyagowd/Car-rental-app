import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// 1. AI Chatbot Assistant (Handles queries related to cars, locations, prices)
router.post('/chatbot', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const query = message.toLowerCase();
    let reply = "";

    // Load some data for query responses
    const cars = await prisma.car.findMany({ include: { brand: true, location: true } });
    const locations = await prisma.location.findMany();

    if (query.includes('cheap') || query.includes('low price') || query.includes('budget')) {
      const sorted = [...cars].sort((a, b) => a.dailyPrice - b.dailyPrice);
      if (sorted.length > 0) {
        reply = `Our most affordable rental is the **${sorted[0].brand.name} ${sorted[0].name}** costing just **₹${sorted[0].dailyPrice}/day** (₹${sorted[0].hourlyPrice}/hour) located at *${sorted[0].location.name}*.`;
      } else {
        reply = "We currently have no available cars listed.";
      }
    } else if (query.includes('suv') || query.includes('large') || query.includes('family')) {
      const suvs = cars.filter(c => ['Nexon', 'Creta', 'Punch', 'XUV700', 'Bolero Neo', 'Sonet'].includes(c.name));
      if (suvs.length > 0) {
        reply = `Here are some of our command-presence SUVs perfect for family trips: \n` + 
          suvs.slice(0, 3).map(s => `- **${s.brand.name} ${s.name}** (₹${s.dailyPrice}/day, ${s.seating} seater)`).join('\n');
      } else {
        reply = "All our current SUVs are booked or under maintenance.";
      }
    } else if (query.includes('electric') || query.includes('ev')) {
      const electrics = cars.filter(c => c.fuelType === 'ELECTRIC');
      if (electrics.length > 0) {
        reply = `We support green travel! Here is our available EV: \n` +
          electrics.map(e => `- **${e.brand.name} ${e.name}** (₹${e.dailyPrice}/day, Mileage: ${e.mileage} km/kWh)`).join('\n');
      } else {
        reply = "Currently, we don't have electric vehicles in our active fleet, but we have high-mileage hybrid/petrol hatchbacks like Baleno (22.9 km/l)!";
      }
    } else if (query.includes('location') || query.includes('where')) {
      reply = `We operate across multiple key Indian hubs: \n` + 
        locations.map(l => `- **${l.name}** (${l.address})`).join('\n');
    } else if (query.includes('document') || query.includes('license') || query.includes('aadhaar')) {
      reply = "To rent a vehicle, you need to upload a valid **Indian Driving License** (Front & Back) and a **Selfie** holding your license. Document approval takes less than 10 minutes!";
    } else if (query.includes('deposit') || query.includes('refundable')) {
      reply = "All rentals require a security deposit ranging from **₹3,000 to ₹7,000** depending on the car type. This deposit is 100% refundable immediately upon safe vehicle return.";
    } else {
      reply = "Hello! I am your AI Rental Assistant. I can help you find cheap cars, locate SUVs, clarify driving license requirements, or list rental branch locations. Try asking: *'Show me budget cars'* or *'Which SUVs are available?'*";
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ reply: "I'm having trouble analyzing the inventory right now. Please try again." });
  }
});

// 2. OCR Driving License Details Extraction Simulation
router.post('/ocr-license', authenticateToken, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ message: 'Image URL or base64 is required' });

    // Simulate OCR analysis delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate random realistic Indian Driving License data based on customer info
    const randomDlNum = `DL-${Math.floor(10 + Math.random() * 90)}202${Math.floor(10 + Math.random() * 90)}${Math.floor(100000 + Math.random() * 900000)}`;
    const randomDob = `199${Math.floor(0 + Math.random() * 9)}-0${Math.floor(1 + Math.random() * 8)}-${Math.floor(10 + Math.random() * 18)}`;

    res.json({
      success: true,
      extractedData: {
        licenseNumber: randomDlNum,
        name: "AMIT SHARMA",
        dob: randomDob,
        issueDate: "2021-05-14",
        expiryDate: "2041-05-14",
        vehicleClasses: ["MCWG", "LMV"],
        confidenceScore: 0.96
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'OCR analysis failed' });
  }
});

// 3. AI Demand Forecasting & Dynamic Pricing Advice
router.post('/demand-pricing', async (req, res) => {
  try {
    const { pickupDate, locationId } = req.body;
    if (!pickupDate) return res.status(400).json({ message: 'Pickup date is required' });

    const date = new Date(pickupDate);
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    const month = date.getMonth(); // 0-11

    let multiplier = 1.0;
    let reason = "Standard demand period. Regular pricing applies.";

    // Weekend premium (Saturday/Sunday)
    if (day === 0 || day === 6 || day === 5) {
      multiplier = 1.15;
      reason = "Weekend peak demand period. Dynamic pricing (+15%) applied.";
    }

    // Indian Festival Season spike (October, November, December)
    if (month >= 9 && month <= 11) {
      multiplier = 1.25;
      reason = "Indian festival holiday season peak demand (+25%) applied.";
    }

    res.json({
      multiplier,
      reason,
      surgeActive: multiplier > 1.0,
      predictedUtilization: multiplier > 1.15 ? "HIGH (85%+)" : "MODERATE (60%)"
    });
  } catch (error) {
    res.status(500).json({ message: 'Forecasting calculation failed' });
  }
});

// 4. AI Fraud Risk Scoring (Checks if a booking has elements of suspicious activity)
router.post('/fraud-check', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: 'Booking ID is required' });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: { include: { documents: true } } }
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Scoring elements
    let riskScore = 0;
    const flags: string[] = [];

    // Checked elements
    if (booking.user.idVerificationStatus !== 'APPROVED') {
      riskScore += 45;
      flags.push('Unapproved or missing driving credentials');
    }

    if (booking.finalAmount > 20000) {
      riskScore += 20;
      flags.push('High transaction value rental');
    }

    const start = new Date(booking.pickupDateTime);
    const leadTimeHours = (start.getTime() - booking.createdAt.getTime()) / (1000 * 60 * 60);
    if (leadTimeHours < 3) {
      riskScore += 25;
      flags.push('Urgent near-instant booking query');
    }

    res.json({
      bookingId,
      riskScore,
      status: riskScore >= 50 ? "FLAGGED_FOR_REVIEW" : "LOW_RISK",
      riskLevel: riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW",
      flags
    });
  } catch (error) {
    res.status(500).json({ message: 'Fraud screening failed' });
  }
});

export default router;
