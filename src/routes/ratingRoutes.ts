import { Router } from "express";
import { createRating, listRatings } from "../controllers/ratingController";
import { VerifyToken } from "../middlewares/authMiddleware";



const router = Router();
//create promotion
router.post("/create", VerifyToken, createRating)
//list 
router.get("/list", listRatings)
//get
router.get("/:id", VerifyToken)
//update
router.patch("/:id", VerifyToken)
//delete
router.delete("/:id", VerifyToken)
export default router;