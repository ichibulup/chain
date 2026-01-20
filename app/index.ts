const timer = Date.now();

import express, {
  Request,
  Response,
  NextFunction
} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from "path";
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from "cookie-parser";
import session from "express-session";
import rateLimit from 'express-rate-limit';
import pc from 'picocolors'
import fs from 'fs';
import { Logging } from "@/lib/logging";
import http, { createServer } from "http";
import { WebSocketServer } from "ws";
import { createRealtime } from "@/lib/supabase/realtime";
// import { prisma } from "@/lib/prisma";

/* ROUTE IMPORTS */
import authRoutes from "@/routes/auth";
// import authAdvancedRoutes from "@/routes/auth-advanced";
// import mfaRoutes from "@/routes/mfa";
// import adminRoutes from "@/routes/admin";
import uploadRoutes from "@/routes/upload";
import userRoutes from "@/routes/user";
import notificationRoutes from "@/routes/notification";
import organizationRoutes from "@/routes/organization";
import restaurantRoutes from "@/routes/restaurant";
import inventoryRoutes from "@/routes/inventory";
import warehouseRoutes from "@/routes/warehouse";
import supplyRoutes from "@/routes/supply";
import purchaseRoutes from "@/routes/purchase";
import categoryRoutes from "@/routes/category";
import menuRoutes from "@/routes/menu";
import marketplaceRoutes from "@/routes/marketplace";
import deliveryRoutes from "@/routes/delivery";
import orderRoutes from "@/routes/order";
import paymentRoutes from "@/routes/payment";
import financeRoutes from "@/routes/finance";
import walletRoutes from "@/routes/wallet";
import promotionRoutes from "@/routes/promotion";
import feedbackRoutes from "@/routes/feedback";
import analyticsRoutes from "@/routes/analytics";

// ================================
// 🌐 EXPRESS SERVER CONFIGURATION
// ================================

/* CONFIGURATIONS */
dotenv.config({
  path: ".env.local",
  override: true,
  debug: false,
  quiet: true
  // processEnv: {},
});
// dotenv.config({ path: ".env.local" });
// const originalLog = console.log;
// console.log = () => {};
// dotenv.config();
// console.log = originalLog;

const app = express();

// app.use(express.json({
app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));
// app.use('/api/', rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// }));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({
  policy: "cross-origin",
}));
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" },
//   contentSecurityPolicy: false, // Disable if causes issues with assets
// }));
// Custom morgan format
morgan.token("response-time-ms", (req: Request, res: Response) => {
  const time = (morgan as any)['response-time'](req, res);
  if (!time) return "-";

  const num = parseFloat(time);
  return num >= 2000 ? `${(num / 1000).toFixed(1)}s` : `${Math.round(num)}ms`;
});
morgan.token("status-color", (req: Request, res: Response) => {
  const s = res.statusCode;
  return s >= 500
    ? pc.red(s)
    : s >= 400
      ? pc.yellow(s)
      : s >= 300
        ? pc.cyan(s)
        : pc.green(s);
});
app.use(morgan(` :method :url :status-color in :response-time-ms ${pc.dim(`(HTTP/:http-version, [:date[clf]], content-length: :res[content-length])`)}`)); // , process: :response-time-ms, :user-agent, :remote-addr, :remote-user, HTTP/:http-version, :referrer
// app.use(morgan('common'));
// app.use((req: Request, res: Response, next: NextFunction) => {
//   const startTime = Date.now();

//   res.on('finish', () => {
//     const duration = Date.now() - startTime;
//     const method = req.method;
//     const url = req.url;
//     const status = res.statusCode;
//     const durationMs = `${duration}ms`;

//     console.log(`${method} ${url} ${status} in ${durationMs}`);
//   });

//   next();
// });

// NOTE: Body parser should be used AFTER multer for multipart forms, but here we use it globally.
// Multer handles multipart/form-data and ignores other types.
// Body parser handles json/urlencoded and ignores multipart/form-data.
// So the order shouldn't strictly matter for multipart, BUT sometimes it does.
// However, since we use multer in specific routes, it should be fine.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(session({
  secret: process.env.EXPRESS_JWT_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.EXPRESS_ENV === 'production', // true nếu dùng HTTPS
    httpOnly: true, // Ngăn JS phía client truy cập
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: 'lax',
    // expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // Thời gian hết hạn cookie
    // domain: process.env.EXPRESS_CLIENT_URL!, // Tùy chọn: tên miền cookie
    // secure: true, // Chỉ gửi cookie qua HTTPS
    // sameSite: 'Lax' // Hoặc 'Strict'. 'None' cần secure: true
    // path: '/', // Phạm vi cookie (thường là gốc)
  }
}));
// Configure CORS
// app.use(cors());
app.use(cors({
  origin: [
    process.env.EXPRESS_PUBLIC_CLIENT_URL!,
    process.env.EXPRESS_PUBLIC_MOBILE_URL!,
  ],
  // origin: "*",
  credentials: true,
  // methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  // exposedHeaders: ['Set-Cookie'],
  // maxAge: 86400, // 24 hours
  // preflightContinue: false,
  // optionsSuccessStatus: 204,
}));

// const server = createServer(app);
// const io = initializeRealtimeChat(server);

/* STATIC FILES */
/* UPLOAD MULTER CONFIG */

const directory = path.resolve(__dirname, "..", "public");
if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
app.use("@/public", express.static(directory));
// app.use("@/public", express.static(directory, {
//   maxAge: '1d',
//   etag: true,
// }));

// const storage = multer.diskStorage({
//   destination: (
//     req,
//     file,
//     cb
//   ): void => {
//     cb(null, "assets");
//   },
//   filename: (
//     req,
//     file,
//     cb
//   ): void => {
//     // cb(null, req.body.name);
//     cb(null, file.originalname);
//   },
// });

// const upload = multer({ storage: storage });

/* ROUTES */
// ================================
// 📡 GRAPHQL ENDPOINT SETUP
// ================================
// ROUTES
// ================================
// app.use('/graphql', createGraphQLMiddleware());

// ================================
// 🛣️ REST API ROUTES (Updated with Supabase Auth)
// ================================
// app.use("/auth", authRoutes);
// app.use("/auth", authAdvancedRoutes);
// app.use("/mfa", mfaRoutes);
// app.use("/admin", adminRoutes);

app.use("/auth", authRoutes); // Keep for backwards compatibility
// app.use("/payment", paymentRoutes); // Payment hooks từ providers
// app.use('/reservation', reservationRoutes); // Public table viewing
// app.use('/upload', uploadRoutes); // File uploads

// Protected routes (require Clerk authentication)
// app.use("/product", productRoutes);
// app.use("/task", taskRoutes);
// app.use('/chat', chatRoutes);
// app.use('/rls', rlsTestRoutes); // RLS testing routes (simple)
// app.use("/purchase", purchaseRoutes)
// app.use("/graphql", graphqlRoutes);
// app.use("/graphql", createGraphQLMiddleware);

app.use("/upload", uploadRoutes)
app.use("/user", userRoutes)
app.use("/notification", notificationRoutes)
app.use("/organization", organizationRoutes)
app.use("/restaurant", restaurantRoutes)
app.use("/inventory", inventoryRoutes)
app.use("/warehouse", warehouseRoutes)
app.use("/supply", supplyRoutes)
app.use("/purchase", purchaseRoutes)
app.use("/category", categoryRoutes)
app.use("/menu", menuRoutes)
app.use("/marketplace", marketplaceRoutes)
app.use("/delivery", deliveryRoutes)
app.use("/order", orderRoutes)
app.use("/payment", paymentRoutes)
app.use("/finance", financeRoutes)
app.use("/wallet", walletRoutes)
app.use("/promotion", promotionRoutes)
app.use("/feedback", feedbackRoutes)
app.use("/analytics", analyticsRoutes)

app.get('/', (
  req: Request,
  res: Response
) => {
  res.send('Professor Synapse API is running');
});

app.get('/health', (
  req: Request,
  res: Response
) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// 404 handler
app.use((
  req: Request,
  res: Response
) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Global error handler
app.use((
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(Logging(`Error: ${error}`, 'error', 'red'));
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.EXPRESS_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// ================================
// 🚀 INITIALIZE REALTIME SERVER
// ================================

const server = createServer(app);
// const wss = new WebSocketServer({ server })
// const io = new Server(server, {
//   cors: {
//     origin: [
//       process.env.EXPRESS_PUBLIC_CLIENT_URL!,
//       process.env.EXPRESS_PUBLIC_MOBILE_URL!,
//     ]
//   }
// })

// io.use()
createRealtime()

// Tracking now uses Supabase Realtime; Socket.IO tracking is disabled.
// initializeTracking(io)

// ================================
// 🚀 START SERVER WITH SOCKET.IO & GRAPHQL
// ================================

const port = process.env.EXPRESS_PORT || 8080;

async function start() {
  try {
    // Test database connection (lazy connection)
    // await prisma.$connect(); // Comment out để tăng tốc, Prisma sẽ tự connect khi cần

    // Start HTTP server with Socket.IO
    server.listen(port, () => {
      const startTime = timer;
      const readyTime = Date.now() - startTime;
      const formattedTime = readyTime < 1000 ? `${readyTime}ms` : `${(readyTime / 1000).toFixed(2)}s`;
      // console.log(`${pc.blue(`→`)} Environment: ${process.env.EXPRESS_ENV || 'development'}`);
      console.log(Logging(`Ready in ${formattedTime}`, 'success', 'green')) // Compiled in
    });

  } catch (error) {
    console.log(Logging(`Failed to start server: ${error}`, 'error', 'red'));
    process.exit(1);
  }
};

async function shutdown() {
  console.log("\b")
  // console.log(`\n ${pc.yellow(`◆`)} received, shutting down gracefully...`);
  // console.log('\nSIGTERM or SIGINT signal received: closing HTTP server');
  try {
    // wss.on("close", () => {})
    // io.on("close", () => {})
    // await prisma.$disconnect();
    // console.log('Database disconnection skipped for demo');
  } catch (error) {
    console.log(Logging(`Error connecting database`, 'warning', 'yellow'))
    // console.error('Error disconnecting database:', error);
  }
  // Remove nodemon started flag file
  // const startedFile = path.resolve(__dirname, '..', '.express', '.started');
  // if (fs.existsSync(startedFile)) {
  //   fs.unlinkSync(startedFile);
  // }
  // process.exit(0);

  server.close(() => {
    process.exit(0);
    // console.log(`${pc.green(`✓`)} HTTP server closed`);
  });

  // // Give ongoing requests time to complete
  // setTimeout(() => {
  //   // console.log(`${pc.yellow(`⚠`)} Forcing shutdown...`);
  //   process.exit(1);
  // }, 5000); // 10 seconds timeout
};

// Graceful shutdown handlers
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
// process.on('uncaughtException', (error) => {
//   console.error(`${pc.red(`⨯`)} Uncaught Exception:`, error);
//   shutdown('uncaughtException');
// });

// process.on('unhandledRejection', (reason, promise) => {
//   console.error(`${pc.red(`⨯`)} Unhandled Rejection at:`, promise, 'reason:', reason);
// });

// Start the server
app.listen(start);

// const PORT = process.env.EXPRESS_PORT || 8080;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

export default app;
