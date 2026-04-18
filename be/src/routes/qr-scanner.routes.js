import express from "express";
import qrScannerController from "../controllers/qr-scanner.controller.js";
import { authenticateToken, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// QR validation endpoints
router.post("/validate", authorize("staff", "admin", "manager"), qrScannerController.validateQR);

router.post("/quick-validate", authorize("staff", "admin", "manager"), qrScannerController.quickValidate);

// Check-in endpoints
router.post("/scan-check-in", authorize("staff", "admin", "manager"), qrScannerController.scanCheckIn);

router.post("/check-in-by-code", authorize("staff", "admin", "manager"), qrScannerController.checkInByCode);

router.post("/bulk-check-in", authorize("staff", "admin", "manager"), qrScannerController.bulkCheckIn);

// QR generation
router.post("/generate/:bookingId", authorize("staff", "admin", "manager"), qrScannerController.generateQR);

// Booking code verification
router.post("/verify-code", authorize("staff", "admin", "manager"), qrScannerController.verifyBookingCode);

// History and statistics
router.get("/history/:theaterId", authorize("staff", "admin", "manager"), qrScannerController.getScanHistory);

router.get("/statistics/:theaterId", authorize("admin", "manager"), qrScannerController.getScanStatistics);

// Camera stream
router.post("/init-camera", authorize("staff", "admin", "manager"), qrScannerController.initCameraStream);

// Testing endpoint (development only)
router.post("/test", authorize("admin"), qrScannerController.testScanner);

export default router;
