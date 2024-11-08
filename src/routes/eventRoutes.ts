import { Router } from "express";
import { CreateEvent, DeleteEvent, GetEvent, GetEventLists, UpdateEvent } from "../controllers/eventController";


const router = Router();


router.post("/create", CreateEvent);
router.get("/list", GetEventLists);
router.get("/:id", GetEvent);
router.patch("/:id", UpdateEvent);
router.delete("/:id", DeleteEvent)

export default router;


