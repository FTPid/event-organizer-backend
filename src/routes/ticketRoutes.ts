import { Router } from "express";
import { buyTicketWithPromotion, getTicketByTransaction, getTransaction } from "../controllers/ticketController";


const router = Router();
//create promotion
router.post("/create", buyTicketWithPromotion)
//list 
// router.get("/list", getUserTickets)
//list 
router.get("/transaction", getTransaction)
//get
router.get("/:id", getTicketByTransaction)
//update
router.patch("/:id",)
//delete
router.delete("/:id",)
export default router;