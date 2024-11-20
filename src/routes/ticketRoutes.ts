import { Router } from "express";
import { buyTicketWithPromotion } from "../controllers/ticketController";


const router = Router();
//create promotion
router.post("/create", buyTicketWithPromotion)
//list 
router.get("/list",)
//get
router.get("/:id",)
//update
router.patch("/:id",)
//delete
router.delete("/:id",)
export default router;