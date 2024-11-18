import { Router } from "express";
import { CreatePromotion, DeletePromotion, GetPromotion, GetPromotions, UpdatePromotion } from "../controllers/promotionController";

const router = Router();
//create promotion
router.post("/create", CreatePromotion)
//list 
router.get("/list", GetPromotions)
//get
router.get("/:id", GetPromotion)
//update
router.patch("/:id", UpdatePromotion)
//delete
router.delete("/:id", DeletePromotion)
export default router;