// ────────────────────────────────────
//  app.js ― Clothing-Inspection API
// ────────────────────────────────────
// SSL configuration removed - PlanetScale handles SSL automatically
if (process.env.RUN_SYNC_DB === 'true') {
  require('./sync-db');
}

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const errorHandler = require('./middleware/errorHandler.js');

const userRoutes        = require('./routes/userRoutes');
const clothesRoutes     = require('./routes/clothesRoutes');
const inspectionRoutes  = require('./routes/inspectionRoutes');
const productRoutes     = require('./routes/productRoutes');
const uploadImageRoutes = require('./routes/uploadImage');
const workerRoutes      = require('./routes/workerRoutes');
const labelRoutes       = require('./routes/labelRoutes');
const adminRoutes       = require('./routes/adminRoutes');
const defectRoutes      = require('./routes/defectRoutes');
const settingsRoutes    = require('./routes/settingsRoutes');
const reportRoutes      = require('./routes/reportRoutes');
const brandRoutes       = require('./routes/brandRoutes');

const app = express();

// Render/Nginx → 앱까지 1단계 프록시만 신뢰 (loopback)
app.set('trust proxy', ['loopback']);

/*──────────── 요청 로그 ───────────────*/
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} origin=${req.headers.origin || 'none'}`);
  next();
});

/*──────────────── CORS ────────────────*/
const allowedOrigins = (process.env.CORS_ORIGIN || 'https://spring.io.kr,https://www.spring.io.kr,https://ap-002-frontend.onrender.com,https://ap-002.onrender.com,http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/*─────── HTTP → HTTPS 리디렉트 ───────*/
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.secure || req.get('x-forwarded-proto') === 'https') {
      return next();
    }
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

/*────────────── 미들웨어 ───────────────*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*──────────── 정적 파일 ────────────────*/
const uploadsPath = process.env.UPLOAD_BASE || path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));
// allow /api/uploads for clients that prepend API base
app.use('/api/uploads', express.static(uploadsPath));

/*────────────── API 라우트 ─────────────*/
app.use('/api/users',       userRoutes);
app.use('/api/clothes',     clothesRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/products',    productRoutes);
app.use('/api',             uploadImageRoutes);
app.use('/api/worker',      workerRoutes);
app.use('/api/labels',      labelRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/defects',     defectRoutes);
app.use('/api/settings',    settingsRoutes);
app.use('/api/reports',     reportRoutes);
app.use('/api/brands',      brandRoutes);

/*────────── 헬스체크 루트 ──────────*/
app.get('/', (_req, res) => res.json({ status: 'ok' }));

/*────────────── 정적 프론트엔드 ────────*/
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const candidatePaths = [
    path.join(__dirname, '..', 'client', 'build'), // 표준 위치
    path.join(__dirname, '..', 'clothing-inspection-frontend', 'build') // 현재 리포 구조
  ];

  const clientBuildPath = candidatePaths.find(p => fs.existsSync(path.join(p, 'index.html')));

  if (clientBuildPath) {
    app.use(express.static(clientBuildPath));
    app.get('*', (req,res)=>{
      if (req.path.startsWith('/api')) return res.status(404).end();
      res.sendFile(path.join(clientBuildPath,'index.html'));
    });
  } else {
    console.warn('⚠️  React build not found. Please run `npm run build` in client and include the build directory in deployment.');
  }
} else {
  // 개발 환경: 루트 헬스체크 JSON
  app.get('/', (_req, res) => res.json({ status: 'dev' }));
}

/*────────────── 헬스체크 ───────────────*/
app.get('/api/healthz', (_, res) => res.json({ status: 'ok' }));

// 데이터베이스 연결 테스트 엔드포인트
app.get('/api/db-test', async (_, res) => {
  try {
    console.log('🔍 Testing database connection...');
    const sequelize = require('./config/database');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    res.json({ status: 'db-ok', message: 'Database connection successful' });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    res.status(500).json({ 
      status: 'db-error', 
      message: error.message,
      name: error.name
    });
  }
});

/*──────────────── 서버 기동 ────────────*/
const PORT   = process.env.PORT || 3002;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[✅] Server is running on port ${PORT}`);
});

/*──────────── 글로벌 예외 로거 ─────────*/
process.on('unhandledRejection', err =>
  console.error('💥 UnhandledRejection:', err));
process.on('uncaughtException',  err =>
  console.error('💥 UncaughtException:', err));

/*──────── SIGTERM 그레이스풀 종료 ─────*/
process.on('SIGTERM', () => {
  console.log('Received SIGTERM → graceful shutdown');
  server.close(() => process.exit(0));
});

app.use(errorHandler);
