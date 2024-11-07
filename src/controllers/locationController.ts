import { PrismaClient } from "@prisma/client";
import e, { Request, Response, NextFunction } from "express";

const prisma = new PrismaClient();

async function CreateLocation(req: Request, res: Response, next: NextFunction) {

    try {
        const { name, address } = req.body;

        await prisma.$transaction(async (prisma) => {
            const findLoc = await prisma.location.findFirst({
                where: {
                    name,
                    address,
                },
            });
            if (findLoc) {
                throw new Error("Address with that name already exist");
            }
            const location = await prisma.location.create({
                data: {
                    name,
                    address,
                },
            });
            res.status(200).send({
                message: "success",
                data: location
            })
        });


    } catch (err) {
        next(err)
    }
}

async function GetLocations(req: Request, res: Response, next: NextFunction) {
    try {
        interface IFilter {
            page: number,
            pageSize: number
        }
        const { page, pageSize } = req.query;

        const filter: IFilter = {
            page: parseInt(page as string) || 1,
            pageSize: parseInt(pageSize as string) || 10
        }
        const skip = (filter.page - 1) * filter.pageSize;

        const data = await prisma.location.findMany({
            skip: skip,
            take: filter.pageSize,
        });

        res.status(200).send({
            message: "success",
            data,
            pagination: {
                currentPage: filter.page,
                pageSize: filter.pageSize
            }
        });
    } catch (err) {
        next(err)
    }
}

async function GetLocation(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const data = await prisma.location.findUnique({
            where: { id: parseInt(id) }

        });
        res.status(200).send({
            message: "success",
            data,
        });

    } catch (err) {
        next(err)
    }
}

async function UpdateLocation(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const { name, address } = req.body;

        await prisma.$transaction(async (prisma) => {
            const data = await prisma.location.update({
                where: { id: parseInt(id) },
                data: { name, address }
            });
            res.status(200).send({
                message: "success",
                data,
            })
        });

    } catch (err) {
        next(err)
    }
}

async function DeleteLocation(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        await prisma.$transaction(async (prisma) => {
            const data = await prisma.location.delete({
                where: { id: parseInt(id) }
            });
            res.status(200).send({
                message: "success",
                data
            })
        });
    } catch (err) {
        next(err)
    }
}

export { CreateLocation, GetLocations, GetLocation, UpdateLocation, DeleteLocation }