import { Router } from "express";
import { CreateEvent, DeleteEvent, GetEvent, GetEventLists, UpdateEvent, upload } from "../controllers/eventController";
import { VerifyToken } from "../middlewares/authMiddleware";


const router = Router();

router.post('/create', VerifyToken, upload.single('image'), CreateEvent);
router.get("/list", GetEventLists);
router.get("/:id", GetEvent);
router.patch("/:id", VerifyToken, UpdateEvent);
router.delete("/:id", VerifyToken, DeleteEvent)

export default router;


