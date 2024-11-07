import { Router } from "express";
import { CreateLocation, DeleteLocation, GetLocation, GetLocations, UpdateLocation } from "../controllers/locationController";


const router = Router();
// create location
router.post("/", CreateLocation)
// list locations
router.get("/list", GetLocations)
// get location
router.get("/:id", GetLocation)
// update location
router.patch("/:id", UpdateLocation)
// delete location
router.delete("/:id", DeleteLocation)
export default router;