import { Request, Response, NextFunction } from "express";
import { compare, genSalt, hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { sign } from "jsonwebtoken";
import { JWT_SECRET } from "../utils/envConfig";

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
    const { email, password, name, role, referralCode: inputReferralCode } = req.body;


    const findUser = await prisma.user.findUnique({
      where: { email },
    });

    if (findUser) throw new Error("Email already exists");


    const salt = await genSalt(10);
    const hashPassword = await hash(password, salt);

    let referralCode = "";
    let isUnique = false;


    while (!isUnique) {
      referralCode = generateReferralCode();
      const existingCode = await prisma.user.findFirst({
        where: { referralCode },
      });
      if (!existingCode) isUnique = true;
    }


    if (inputReferralCode) {
      const referredUser = await prisma.user.findUnique({
        where: { referralCode: inputReferralCode },
      });

      if (referredUser) {
        await prisma.user.update({
          where: { id: referredUser.id },
          data: {
            points: {
              increment: 100,
            },
          },
        });
      } else {

        throw new Error("Invalid referral code");
      }
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


async function Login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const findUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!findUser) throw new Error("Invalid Email");
    const isValid = await compare(password, findUser.password);

    if (!isValid) throw new Error("Invalid Password");


    const payload = {
      id: findUser.id,
      email,
      role: findUser.role
    }

    const token = sign(payload, JWT_SECRET as string, { expiresIn: "1d" })

    res.status(200).cookie("access_token", token).send({
      message: "success",
      access_token: token,
    });
  } catch (err) {
    next(err);
  }
}


export { Register, Login };
