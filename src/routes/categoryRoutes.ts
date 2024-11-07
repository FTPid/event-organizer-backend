import { Router } from 'express';
import { CreateCategory, DeleteCategory, GetCategories, GetCategory, UpdateCategory } from '../controllers/categoryController';


const router = Router();
// create category event
router.post("/create", CreateCategory)
// list data catagories
router.get("/list", GetCategories)
// get  category 
router.get("/:id", GetCategory)
// update category 
router.patch("/:id", UpdateCategory)
// delete category
router.delete("/:id", DeleteCategory)

export default router;
