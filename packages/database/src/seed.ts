import { PrismaClient, Role, MatchStatus, IncidentType, Severity, IncidentStatus, TaskPriority, TaskStatus } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Clear existing data
  console.log("Cleaning up existing tables...");
  await prisma.sustainabilityEvent.deleteMany({});
  await prisma.volunteerTask.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.venue.deleteMany({});
  await prisma.aIConversation.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Insert default venue
  console.log("Seeding venues...");
  const venue = await prisma.venue.create({
    data: {
      name: "MetLife Stadium",
      city: "East Rutherford",
      country: "US",
      capacity: 82500,
      timezone: "America/New_York",
      bimVersion: "v1.4.2",
      beaconNetworkId: "beacon-net-01",
      latitude: 40.8136,
      longitude: -74.0743,
    },
  });

  // 3. Insert users
  console.log("Seeding users...");
  const manager = await prisma.user.create({
    data: {
      auth0Id: "auth0|manager-carlos-123",
      email: "carlos.mendes@stadiumiq.org",
      fullName: "Carlos Mendes",
      role: Role.venue_manager,
      preferredLang: "en",
    },
  });

  const volunteer = await prisma.user.create({
    data: {
      auth0Id: "auth0|volunteer-jake-456",
      email: "jake.whitmore@stadiumiq.org",
      fullName: "Jake Whitmore",
      role: Role.volunteer,
      preferredLang: "en",
      accessibilityNeeds: {},
      dietaryPrefs: ["vegetarian"],
    },
  });

  const fan = await prisma.user.create({
    data: {
      auth0Id: "auth0|fan-priya-789",
      email: "priya.sharma@fan.worldcup.com",
      fullName: "Priya Sharma",
      role: Role.fan,
      preferredLang: "en",
      accessibilityNeeds: { wheelchairRequired: true },
    },
  });

  // 4. Insert matches
  console.log("Seeding matches...");
  const kickoffLive = new Date();
  kickoffLive.setHours(kickoffLive.getHours() - 1); // 1 hour ago (Live)
  
  const kickoffScheduled = new Date();
  kickoffScheduled.setHours(kickoffLive.getHours() + 24); // Tomorrow

  const kickoffCompleted = new Date();
  kickoffCompleted.setHours(kickoffLive.getHours() - 48); // 2 days ago

  const matchLive = await prisma.match.create({
    data: {
      venueId: venue.id,
      homeTeam: "USA",
      awayTeam: "England",
      kickoffTime: kickoffLive,
      status: MatchStatus.live,
      attendance: 78412,
    },
  });

  await prisma.match.create({
    data: {
      venueId: venue.id,
      homeTeam: "Mexico",
      awayTeam: "Argentina",
      kickoffTime: kickoffScheduled,
      status: MatchStatus.scheduled,
    },
  });

  await prisma.match.create({
    data: {
      venueId: venue.id,
      homeTeam: "Canada",
      awayTeam: "Germany",
      kickoffTime: kickoffCompleted,
      status: MatchStatus.completed,
      attendance: 81102,
    },
  });

  // 5. Insert tickets
  console.log("Seeding tickets...");
  await prisma.ticket.create({
    data: {
      fanId: fan.id,
      matchId: matchLive.id,
      seatSection: "212",
      seatRow: "12",
      seatNumber: "4",
      gate: "B",
      qrCode: "FIFA2026-MATCH82-SEC212-R12-S4",
      isAccessible: true,
      isUsed: false,
    },
  });

  // 6. Insert incidents
  console.log("Seeding incidents...");
  await prisma.incident.create({
    data: {
      venueId: venue.id,
      matchId: matchLive.id,
      reportedBy: volunteer.id,
      type: IncidentType.crowd,
      severity: Severity.high,
      description: "Crowd density buildup at Gate A ticket turnstiles. Inflow bottleneck detected by computer vision camera #4.",
      locationZone: "Gate A Entry",
      status: IncidentStatus.open,
      aiSummary: "Gate A turnstile flow rate decreased by 35%. Predicted queue overflow within 8 minutes.",
      aiActions: ["Redirect incoming fans to Gate B", "Dispatch crowd control staff", "Issue push alert to nearby sections"],
    },
  });

  await prisma.incident.create({
    data: {
      venueId: venue.id,
      matchId: matchLive.id,
      reportedBy: volunteer.id,
      type: IncidentType.infrastructure,
      severity: Severity.medium,
      description: "Elevator 4 malfunction in West Concourse near Section 200. Elevator is locked on Level 2 with no passengers.",
      locationZone: "West Concourse Sec 200",
      status: IncidentStatus.in_progress,
    },
  });

  await prisma.incident.create({
    data: {
      venueId: venue.id,
      matchId: matchLive.id,
      reportedBy: fan.id,
      type: IncidentType.other,
      severity: Severity.low,
      description: "Smart waste bin overflowing in food court section 204. Contains plastic/organic mix overflow.",
      locationZone: "Food Court Sec 204",
      status: IncidentStatus.open,
    },
  });

  // 7. Insert volunteer tasks
  console.log("Seeding volunteer tasks...");
  await prisma.volunteerTask.create({
    data: {
      volunteerId: volunteer.id,
      assignedById: manager.id,
      matchId: matchLive.id,
      title: "Redirect Section 200 flow to Gate B",
      description: "Stand at West Concourse exit and redirect incoming ticketholders towards Gate B due to high congestion at Gate A.",
      priority: TaskPriority.high,
      status: TaskStatus.in_progress,
      dueAt: new Date(Date.now() + 30 * 60000), // in 30 mins
    },
  });

  await prisma.volunteerTask.create({
    data: {
      volunteerId: volunteer.id,
      assignedById: manager.id,
      matchId: matchLive.id,
      title: "Deliver accessibility escort for Priya Sharma (Sec 212)",
      description: "Escort Priya Sharma from Gate B elevator to Section 212 Row 12 Seat 4 wheelchair companion space.",
      priority: TaskPriority.high,
      status: TaskStatus.pending,
      dueAt: new Date(Date.now() + 45 * 60000), // in 45 mins
    },
  });

  await prisma.volunteerTask.create({
    data: {
      volunteerId: volunteer.id,
      assignedById: manager.id,
      matchId: matchLive.id,
      title: "Distribute sustainability flyers at West Gate",
      description: "Hand out waste-sorting flyers and reusable cups to early arrival fans entering West Gate.",
      priority: TaskPriority.low,
      status: TaskStatus.completed,
      completedAt: new Date(),
    },
  });

  // 8. Seeding knowledge base vectors
  console.log("Seeding knowledge base vector chunks...");
  const mockChunks = [
    {
      title: "Halal Food Location",
      content: "The nearest halal concession is 'Halal Bites' located in the West Concourse near Section 112. It serves halal-certified chicken shawarma, beef gyros, and falafel platters.",
      embeddingText: "where is the halal food concession location Section 112"
    },
    {
      title: "Lost Child Protocol",
      content: "LOST CHILD PROTOCOL: 1. Keep the child at your location; do not walk away. 2. Contact Section Supervisor immediately. 3. Log incident in portal under High severity. 4. Do NOT broadcast child's name over public channels.",
      embeddingText: "lost child protocols procedures section coordinator PA system"
    },
    {
      title: "Gate A Congestion redirection",
      content: "Gate A is currently experiencing high crowd density (92% occupancy). We recommend that all incoming volunteers and fans redirect their routes via Gate B or Gate C, which have wait times under 3 minutes.",
      embeddingText: "Gate A crowd congestion bottleneck redirect Gate B Gate C queue length"
    }
  ];

  for (const chunk of mockChunks) {
    const id = crypto.randomUUID();
    const vec = generateMockVector(384, chunk.embeddingText);
    const vectorStr = `[${vec.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_base (id, title, content, embedding) VALUES ($1::uuid, $2, $3, $4::vector)`,
      id, chunk.title, chunk.content, vectorStr
    );
  }

  console.log("Database seeding completed successfully!");
}

function generateMockVector(size: number, text: string): number[] {
  const vec = new Array(size).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  for (let i = 0; i < size; i++) {
    const scale = Math.sin(hash + i) * 10000;
    vec[i] = scale - Math.floor(scale);
  }
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map(val => val / (magnitude || 1));
}

main()
  .catch((e) => {
    console.error("Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
