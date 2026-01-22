import Router from "express";
import {
  stripePayment,
  stripeSelection,
  momoPayment,
  momoCallback,
  momoTransactionStatus,
  zalopayPayment,
  zalopayCallback,
  zalopayCheckStatus,
  vnpayPayment,
  vnpayCallback,
  paypalCreateOrder,
  paypalCaptureOrder,
} from "@/controllers/wallet";

const router = Router();

router.post("/stripe", stripePayment)
router.post("/stripe/sheet", stripeSelection)

router.post("/momo", momoPayment);
router.post("/momo/callback", momoCallback);
router.post("/momo/status", momoTransactionStatus); // transaction-status

router.post("/zalopay", zalopayPayment);
router.post("/zalopay/callback", zalopayCallback);
router.post("/zalopay/status/:id", zalopayCheckStatus); // check-status

router.post("/vnpay", vnpayPayment);
router.post("/vnpay/callback", vnpayCallback);
router.post("/vnpay/status", vnpayCallback); //

router.post("/paypal", paypalCreateOrder);
router.post("/paypal/capture", paypalCaptureOrder);

export default router;
