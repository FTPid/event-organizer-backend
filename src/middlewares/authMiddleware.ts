import { NextFunction, Response, Request } from "express";
import { verify } from "jsonwebtoken";
import { JWT_SECRET } from "../utils/envConfig";
import { User } from "@prisma/client";

async function VerifyToken(req: Request, res:Response , next: NextFunction) {
    try {
        const token = req.header("Authorization")?.replace("Bearer", "");
        if(!token) throw new Error("Unauthorized");

        const user = verify(token,JWT_SECRET as string);

        if(!user) throw new Error("Unauthorized");
        
        req.user = user as User;
        console.log(user);
        next()
    } catch (err) {
        next(err);
    }
}

async function AdminGuard(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== "ADMIN") throw new Error("Not an Admin");

    next();
  } catch (err) {
    next(err);
  }
}

export {VerifyToken, AdminGuard}