import { Request, Response, NextFunction } from "express";
import { genSalt, hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateReferralCode(length: number = 6): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function Register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, role } = req.body;

    const findUser = await prisma.user.findUnique({
      where: { email },
    });

    if (findUser) throw new Error("Email already exists");

    const salt = await genSalt(10);
    const hashPassword = await hash(password, salt);

    // Generate a unique referral code
    let referralCode = ""; // Initialize with an empty string
    let isUnique = false;

    while (!isUnique) {
      referralCode = generateReferralCode(); // Generate random code
      const existingCode = await prisma.user.findFirst({
        where: { referralCode },
      });
      if (!existingCode) isUnique = true;
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashPassword,
        name,
        role,
        referralCode,
      },
    });

    res.status(200).send({
      message: "success",
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
}



export { Register };
