// database/seed.ts — Comprehensive sample data for Becho marketplace
// Run: npx tsx database/seed.ts

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) throw new Error("DATABASE_URL not set in .env");

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Becho marketplace with rich student listings...\n");

  // ── Password Hashes ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12);

  // ── Student Users ────────────────────────────────────────────
  const priya = await prisma.user.upsert({
    where: { email: "seller@vit.edu" },
    update: { reputation: 4.9, isVerified: true },
    create: {
      email: "seller@vit.edu",
      name: "Priya Sharma",
      passwordHash,
      role: "SELLER",
      isVerified: true,
      reputation: 4.9,
    },
  });

  const rohan = await prisma.user.upsert({
    where: { email: "rohan.mehta@vit.edu" },
    update: { reputation: 4.7, isVerified: true },
    create: {
      email: "rohan.mehta@vit.edu",
      name: "Rohan Mehta",
      passwordHash,
      role: "SELLER",
      isVerified: true,
      reputation: 4.7,
    },
  });

  const sneha = await prisma.user.upsert({
    where: { email: "sneha.patil@vit.edu" },
    update: { reputation: 4.8, isVerified: true },
    create: {
      email: "sneha.patil@vit.edu",
      name: "Sneha Patil",
      passwordHash,
      role: "SELLER",
      isVerified: true,
      reputation: 4.8,
    },
  });

  const tanmay = await prisma.user.upsert({
    where: { email: "tanmay.joshi@vit.edu" },
    update: { reputation: 4.6, isVerified: true },
    create: {
      email: "tanmay.joshi@vit.edu",
      name: "Tanmay Joshi",
      passwordHash,
      role: "SELLER",
      isVerified: true,
      reputation: 4.6,
    },
  });

  const ananya = await prisma.user.upsert({
    where: { email: "ananya.sen@vit.edu" },
    update: { reputation: 4.9, isVerified: true },
    create: {
      email: "ananya.sen@vit.edu",
      name: "Ananya Sen",
      passwordHash,
      role: "SELLER",
      isVerified: true,
      reputation: 4.9,
    },
  });

  const vikram = await prisma.user.upsert({
    where: { email: "vikram.patel@vit.edu" },
    update: { reputation: 4.5, isVerified: true },
    create: {
      email: "vikram.patel@vit.edu",
      name: "Vikram Patel",
      passwordHash,
      role: "SELLER",
      isVerified: true,
      reputation: 4.5,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@vit.edu" },
    update: { reputation: 4.2, isVerified: true },
    create: {
      email: "buyer@vit.edu",
      name: "Aditya Buyer",
      passwordHash,
      role: "BUYER",
      isVerified: true,
      reputation: 4.2,
    },
  });

  console.log(`✅ Upserted ${[priya, rohan, sneha, tanmay, ananya, vikram, buyer].length} student profiles`);

  // ── Marketplace Listings (32 Items Across All 11 Categories) ──
  const seedListings = [
    // 1. NOTES
    {
      id: "seed-listing-1",
      title: "DBMS Complete Hand-written Notes — Sem 4",
      description:
        "Comprehensive hand-written + typed notes covering all topics: ER diagrams, relational algebra, normal forms (1NF to BCNF), SQL queries, transactions, ACID properties, and B+ tree indexing. Includes previous year exam questions.",
      price: 49,
      type: "ONLINE" as const,
      category: "Notes",
      subject: "Database Management Systems",
      semester: 4,
      condition: null,
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: priya.id,
    },
    {
      id: "seed-listing-2",
      title: "Cycle — Hero Sprint 26\" Campus Commuter",
      description:
        "Single speed Hero Sprint bicycle used for 2 semesters. Brand new front tube, brake pads replaced last month. Includes wire basket, bell, and heavy-duty number lock. Perfect for commuting between hostels and academic blocks.",
      price: 2400,
      type: "OFFLINE" as const,
      category: "Cycles",
      subject: null,
      semester: null,
      condition: "Good",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: rohan.id,
    },
    {
      id: "seed-listing-3",
      title: "DSA in C++ & Java — Complete 450 Sheet & Cheat Sheets",
      description:
        "All-in-one curated revision cheat sheet covering time/space complexities, two pointers, sliding window, binary search templates, tree traversals, and dynamic programming patterns with clean code snippets.",
      price: 0,
      type: "ONLINE" as const,
      category: "Notes",
      subject: "Data Structures & Algorithms",
      semester: 3,
      condition: null,
      isFree: true,
      images: [
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: priya.id,
    },
    {
      id: "seed-listing-4",
      title: "Introduction to Algorithms (CLRS 3rd Edition) — Hardcover",
      description:
        "Standard reference book for core algorithms and competitive programming. Hardcover edition with zero pen marks, no folded pages. Original MRP ₹1,495, giving away at steep student discount.",
      price: 650,
      type: "OFFLINE" as const,
      category: "Books",
      subject: "Algorithms",
      semester: 4,
      condition: "Like New",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: ananya.id,
    },
    {
      id: "seed-listing-5",
      title: "Computer Networking: A Top-Down Approach (Kurose & Ross)",
      description:
        "7th International Edition. Covers Application layer to Physical layer, TCP/UDP sockets, Wireshark lab exercises, and routing algorithms (OSPF/BGP). Very clean condition.",
      price: 420,
      type: "OFFLINE" as const,
      category: "Books",
      subject: "Computer Networks",
      semester: 5,
      condition: "Good",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: tanmay.id,
    },
    {
      id: "seed-listing-6",
      title: "GATE CS & IT Previous 15 Years Chapter-wise Solved Papers",
      description:
        "Made Easy publication book with in-depth step-by-step explanations for all questions from 2010 to 2025. Unmarked and comes with free online formula handbook.",
      price: 350,
      type: "OFFLINE" as const,
      category: "Books",
      subject: "GATE Computer Science",
      semester: 6,
      condition: "Like New",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: priya.id,
    },
    {
      id: "seed-listing-7",
      title: "Higher Engineering Mathematics by B.S. Grewal (44th Ed)",
      description:
        "The holy grail for First & Second year Engineering Math. Calculus, Differential Equations, Linear Algebra, Laplace transforms, and Numerical methods. Essential for semester exams.",
      price: 480,
      type: "OFFLINE" as const,
      category: "Books",
      subject: "Engineering Mathematics",
      semester: 2,
      condition: "Good",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: vikram.id,
    },
    {
      id: "seed-listing-8",
      title: "Firefox Target 21-Speed Geared Mountain Bike",
      description:
        "Shimano Tourney 21-speed gears, front disc brake, zoom suspension fork, and lightweight alloy frame. Bought last year for ₹13,500. Smooth shifting and campus ready.",
      price: 4800,
      type: "OFFLINE" as const,
      category: "Cycles",
      subject: null,
      semester: null,
      condition: "Like New",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: rohan.id,
    },
    {
      id: "seed-listing-9",
      title: "Hercules Roadeo Hardliner 26T with Front Suspension",
      description:
        "Sturdy steel frame bicycle with front shock absorbers and dual V-brakes. Recently serviced with fresh grease and brake cables. Reliable campus ride.",
      price: 2900,
      type: "OFFLINE" as const,
      category: "Cycles",
      subject: null,
      semester: null,
      condition: "Good",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: vikram.id,
    },
    {
      id: "seed-listing-10",
      title: "Arduino Uno R3 Ultimate Starter Kit with 35+ Sensors",
      description:
        "Complete microcontroller lab kit: Arduino Uno R3, breadboard, LCD 1602 display, servo motor, stepper motor, ultrasonic sensor, IR remote, RFID reader, and 65 jumper wires in organizer box.",
      price: 1100,
      type: "OFFLINE" as const,
      category: "Hardware",
      subject: "Embedded Systems",
      semester: 4,
      condition: "Like New",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: sneha.id,
    },
    {
      id: "seed-listing-11",
      title: "Raspberry Pi 4 Model B (4GB RAM) + Official Adapter & Case",
      description:
        "Broadcom BCM2711 quad-core Cortex-A72, 4GB LPDDR4 RAM, dual micro-HDMI 4K outputs, Gigabit Ethernet. Includes acrylic casing, quiet cooling fan, and 32GB Sandisk Ultra microSD.",
      price: 3200,
      type: "OFFLINE" as const,
      category: "Hardware",
      subject: "IoT & Cloud",
      semester: 5,
      condition: "Like New",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1608564697071-ddf911d81370?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: tanmay.id,
    },
    {
      id: "seed-listing-12",
      title: "ESP32 Wi-Fi + Bluetooth Dev Board with OLED Display",
      description:
        "Dual-core ESP32-WROOM-32 with integrated 0.96 inch I2C OLED display. Pre-soldered header pins. Ideal for smart home and college capstone IoT projects.",
      price: 450,
      type: "OFFLINE" as const,
      category: "Hardware",
      subject: "IoT",
      semester: 4,
      condition: "Brand New",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: sneha.id,
    },
    {
      id: "seed-listing-13",
      title: "Casio FX-991EX ClassWiz Scientific Calculator",
      description:
        "High-resolution 4X natural textbook display with 552 functions including matrix calculations, polynomial solvers, numerical integration, and statistics. Allowed in university examinations.",
      price: 750,
      type: "OFFLINE" as const,
      category: "Equipment",
      subject: "Engineering Mathematics",
      semester: 2,
      condition: "Like New",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: ananya.id,
    },
    {
      id: "seed-listing-14",
      title: "Zebronics 24-inch Full HD 75Hz IPS Gaming / Coding Monitor",
      description:
        "Frameless bezel design with vibrant IPS panel, 75Hz refresh rate, HDMI and VGA ports. Perfect second screen for coding, reading research papers, and gaming.",
      price: 4200,
      type: "OFFLINE" as const,
      category: "Equipment",
      subject: null,
      semester: null,
      condition: "Good",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: rohan.id,
    },
    {
      id: "seed-listing-15",
      title: "Redragon K552 Mechanical Keyboard (Blue Switches)",
      description:
        "Tenkeyless compact 87-key mechanical keyboard with clicky tactile blue switches, rainbow LED backlighting, and solid aluminum alloy casing. Great typing feedback.",
      price: 1250,
      type: "OFFLINE" as const,
      category: "Equipment",
      subject: null,
      semester: null,
      condition: "Good",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: tanmay.id,
    },
    {
      id: "seed-listing-16",
      title: "Sony WH-CH520 Wireless Bluetooth Headphones (50hr Battery)",
      description:
        "Up to 50 hours battery life with quick charging, multipoint connection (connects to phone + laptop simultaneously), and DSEE audio upscaling. Great for study sessions in the library.",
      price: 1550,
      type: "OFFLINE" as const,
      category: "Equipment",
      subject: null,
      semester: null,
      condition: "Like New",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: priya.id,
    },
    {
      id: "seed-listing-17",
      title: "Machine Learning & Deep Learning Formula Reference Sheets",
      description:
        "Color-coded mathematical derivations and summary tables for Linear Regression, SVMs, Decision Trees, CNN backpropagation, RNNs, Attention Mechanisms, and Transformer architectures.",
      price: 79,
      type: "ONLINE" as const,
      category: "Notes",
      subject: "Machine Learning",
      semester: 6,
      condition: null,
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: sneha.id,
    },
    {
      id: "seed-listing-18",
      title: "Operating Systems & System Architecture Exam Revision Notes",
      description:
        "Handwritten diagrams and concise explanations for CPU scheduling algorithms, synchronization (semaphores, mutex, dining philosophers), deadlock detection, and virtual memory paging.",
      price: 59,
      type: "ONLINE" as const,
      category: "Notes",
      subject: "Operating Systems",
      semester: 4,
      condition: null,
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: priya.id,
    },
    {
      id: "seed-listing-19",
      title: "Engineering Mathematics III — Complete Formula Booklet",
      description:
        "Quick revision cheat sheet containing all essential formulas for Fourier Series, Laplace Transforms, Z-Transforms, and Partial Differential Equations.",
      price: 0,
      type: "ONLINE" as const,
      category: "Notes",
      subject: "Engineering Mathematics",
      semester: 3,
      condition: null,
      isFree: true,
      images: [
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: ananya.id,
    },
    {
      id: "seed-listing-20",
      title: "Figma UI/UX Campus Design System & Wireframe Kit",
      description:
        "Free production-ready Figma component library with auto-layout buttons, input fields, navigation bars, modal dialogs, and dark mode color palettes for student hackathons.",
      price: 0,
      type: "ONLINE" as const,
      category: "Software",
      subject: "UI/UX Design",
      semester: null,
      condition: null,
      isFree: true,
      images: [
        "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: priya.id,
    },
    {
      id: "seed-listing-21",
      title: "Automated Timetable & Attendance Tracker (Python + SQLite)",
      description:
        "Clean desktop GUI application built with Python Tkinter and SQLite. Alerts you when attendance in any subject drops below 75%, calculates bunk margins, and exports PDF attendance reports.",
      price: 149,
      type: "ONLINE" as const,
      category: "Software",
      subject: "Python Development",
      semester: 3,
      condition: null,
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: tanmay.id,
    },
    {
      id: "seed-listing-22",
      title: "Full-Stack Next.js 14 & Supabase Project Masterclass",
      description:
        "12 hours of self-paced video lessons + full repository source code teaching Server Actions, App Router, Row-Level Security with Supabase, Prisma ORM, and Stripe payments.",
      price: 199,
      type: "ONLINE" as const,
      category: "Tutorials",
      subject: "Web Development",
      semester: 5,
      condition: null,
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: rohan.id,
    },
    {
      id: "seed-listing-23",
      title: "System Design & Distributed Systems Interview Guide",
      description:
        "High-level architecture breakdowns for URL Shortener, Twitter Feed, Rate Limiter, Notification Service, and Uber geospatial matching with latency numbers and trade-off tables.",
      price: 120,
      type: "ONLINE" as const,
      category: "Tutorials",
      subject: "System Design",
      semester: 7,
      condition: null,
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: priya.id,
    },
    {
      id: "seed-listing-24",
      title: "Omega Engineering Mini Drafter with Sheet Holder & Scale",
      description:
        "High-precision mini drafter with steel arms, smooth pivot clamp, and unbroken clear scale. Includes drawing board clips and hard carrying case. A must-have for First Year Engineering Graphics.",
      price: 320,
      type: "OFFLINE" as const,
      category: "Lab Tools",
      subject: "Engineering Graphics",
      semester: 1,
      condition: "Good",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: vikram.id,
    },
    {
      id: "seed-listing-25",
      title: "White 100% Cotton Chemistry & Workshop Lab Coat (Size L)",
      description:
        "Heavy-duty pure cotton protective lab coat with three front pockets and reinforced stitching. Cleanly washed and ironed, compliant with college chemistry and mechanical lab safety norms.",
      price: 180,
      type: "OFFLINE" as const,
      category: "Lab Tools",
      subject: "Chemistry & Workshop Lab",
      semester: 1,
      condition: "Like New",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: ananya.id,
    },
    {
      id: "seed-listing-26",
      title: "Digital Stainless Steel Vernier Caliper (0-150mm / 0.01mm)",
      description:
        "Accurate LCD digital caliper for internal, external, depth, and step measurements in mm or inches. Comes in protective padded case with extra LR44 battery.",
      price: 390,
      type: "OFFLINE" as const,
      category: "Lab Tools",
      subject: "Mechanical Workshop",
      semester: 2,
      condition: "Like New",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: sneha.id,
    },
    {
      id: "seed-listing-27",
      title: "Multi-Angle Foldable Wooden Bed Study Table with Cup Holder",
      description:
        "Spacious wooden lap desk with non-slip curved edge, tablet groove, cup holder, and sturdy aluminum legs. Folds flat for compact storage under the hostel bed.",
      price: 350,
      type: "OFFLINE" as const,
      category: "Furniture",
      subject: null,
      semester: null,
      condition: "Like New",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: tanmay.id,
    },
    {
      id: "seed-listing-28",
      title: "Ergonomic High-Back Breathable Mesh Study Chair",
      description:
        "Pneumatic height adjustment, 360-degree silent castor wheels, contoured lumbar support, and breathable mesh back. Keeps posture upright during late-night coding sessions.",
      price: 1850,
      type: "OFFLINE" as const,
      category: "Furniture",
      subject: null,
      semester: null,
      condition: "Good",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1580481077195-c3a82104e46b?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: rohan.id,
    },
    {
      id: "seed-listing-29",
      title: "Wakefit Dual Comfort Single Foam Mattress (72 x 36 x 4 in)",
      description:
        "Single bed mattress with medium soft and medium firm sides. Sanitized and covered with removable zipper protector. Used for 1 academic year in campus hostel.",
      price: 1700,
      type: "OFFLINE" as const,
      category: "Furniture",
      subject: null,
      semester: null,
      condition: "Good",
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: vikram.id,
    },
    {
      id: "seed-listing-30",
      title: "GATE CS 2026 Grand Mock Test Series (12 Tests + Solutions)",
      description:
        "Comprehensive test series modeled strictly according to the latest IISc/IIT GATE CS syllabus. Detailed answer keys, negative marking calculators, and sectional analysis.",
      price: 0,
      type: "ONLINE" as const,
      category: "Mock Tests",
      subject: "GATE CS",
      semester: 7,
      condition: null,
      isFree: true,
      images: [
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: priya.id,
    },
    {
      id: "seed-listing-31",
      title: "Campus Placement Aptitude & Verbal Reasoning Practice Pack",
      description:
        "600+ handpicked quantitative aptitude, logical reasoning, and data interpretation questions with shortcuts, trick formulas, and company-specific question banks for TCS, Infosys, and Cognizant.",
      price: 89,
      type: "ONLINE" as const,
      category: "Mock Tests",
      subject: "Campus Placements",
      semester: 6,
      condition: null,
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: tanmay.id,
    },
    {
      id: "seed-listing-32",
      title: "Smart IoT Soil Moisture & Automated Irrigation Capstone Project",
      description:
        "Complete Final Year project bundle: ESP32 C++ firmware, MQTT cloud broker setup, Blynk mobile dashboard layout, complete circuit schematic, and 45-page IEEE formatted project report.",
      price: 299,
      type: "ONLINE" as const,
      category: "Projects",
      subject: "Internet of Things",
      semester: 7,
      condition: null,
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: sneha.id,
    },
    {
      id: "seed-listing-33",
      title: "AI-Powered Resume Screening & ATS Ranking Engine (FastAPI + React)",
      description:
        "Production-ready open source code: NLP keyword extractor using Spacy and Sentence-Transformers, PDF parser, similarity matching score, modern Tailwind/React frontend, and Dockerfile.",
      price: 349,
      type: "ONLINE" as const,
      category: "Projects",
      subject: "Artificial Intelligence",
      semester: 8,
      condition: null,
      isFree: false,
      images: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      ],
      sellerId: rohan.id,
    },
  ];

  console.log(`📦 Upserting ${seedListings.length} marketplace listings...`);

  for (const item of seedListings) {
    await prisma.listing.upsert({
      where: { id: item.id },
      update: {
        title: item.title,
        description: item.description,
        price: item.price,
        type: item.type,
        category: item.category,
        subject: item.subject,
        semester: item.semester,
        condition: item.condition,
        isFree: item.isFree,
        status: "ACTIVE",
        images: item.images,
        sellerId: item.sellerId,
      },
      create: {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        type: item.type,
        category: item.category,
        subject: item.subject,
        semester: item.semester,
        condition: item.condition,
        isFree: item.isFree,
        status: "ACTIVE",
        images: item.images,
        sellerId: item.sellerId,
      },
    });
  }

  console.log(`✅ All ${seedListings.length} listings successfully upserted!`);

  // ── Mentorship Posts ─────────────────────────────────────────
  await prisma.mentorship.upsert({
    where: { id: "seed-mentorship-1" },
    update: {},
    create: {
      id: "seed-mentorship-1",
      subject: "DSA & Competitive Programming 1-on-1 Mentorship",
      description:
        "I can help you master DSA patterns (DP, Graphs, Trees) and crack tech interviews. Codeforces 1650+ / LeetCode Guardian.",
      hourlyRate: 150,
      tags: ["DSA", "C++", "Competitive Programming", "LeetCode"],
      mentorId: priya.id,
    },
  });

  await prisma.mentorship.upsert({
    where: { id: "seed-mentorship-2" },
    update: {},
    create: {
      id: "seed-mentorship-2",
      subject: "Full-Stack Web Dev & Hackathon Project Mentorship",
      description:
        "Guidance on building full-stack web apps, architecture design, and winning campus hackathons. Winner of 3 national hackathons.",
      hourlyRate: 200,
      tags: ["React", "Next.js", "Node.js", "System Design", "PostgreSQL"],
      mentorId: rohan.id,
    },
  });

  console.log("✅ Mentorship offerings updated!");
  console.log("\n🎉 Database seed complete! 33 items are now live in the marketplace.\n");
}

main()
  .catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
