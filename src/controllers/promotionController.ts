import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';


const prisma = new PrismaClient();


async function CreatePromotion(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, discount, eventId, isActive, type, referralCode, usageLimit, usedCount } = req.body;

        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            res.status(404).send({
                message: 'Event not found',
            });
            return;
        }

        const existingPromotion = await prisma.promotion.findFirst({
            where: { eventId },
        });

        if (existingPromotion) {
            res.status(400).send({ message: 'Promotion already exists for this event' });
            return;
        }


        const promotion = await prisma.promotion.create({
            data: {
                name,
                discount,
                type,
                referralCode,
                eventId,
                usageLimit,
                usedCount: 0,
                isActive,
            },
        });

        res.status(201).send({
            message: 'Promotion created successfully',
            promotion,
        });
    } catch (err) {
        next(err);
    }
}

async function GetPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { page, pageSize } = req.query;

        const currentPage = parseInt(page as string) || 1;
        const size = parseInt(pageSize as string) || 10;

        const skip = (currentPage - 1) * size;
        const take = size;

        const promotions = await prisma.promotion.findMany({
            where: { isActive: true },
            include: { event: true },
            skip,
            take,
        });

        const totalPromotions = await prisma.promotion.count({
            where: { isActive: true },
        });

        const totalPages = Math.ceil(totalPromotions / size);

        res.status(200).send({
            message: 'Promotions retrieved successfully',
            data: promotions,
            pagination: {
                currentPage,
                pageSize: size,
                totalPages,
                totalPromotions,
            },
        });
    } catch (err) {
        next(err);
    }
}

async function GetPromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { id } = req.params;

        const promotion = await prisma.promotion.findUnique({
            where: { id: parseInt(id) },
            include: { event: true },
        });

        if (!promotion) {
            res.status(404).send({ message: 'Promotion not found' });
            return;
        }

        res.status(200).send({
            message: 'Promotion fetched successfully',
            promotion,
        });
    } catch (err) {
        next(err);
    }
}


async function UpdatePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { id } = req.params;
        const { name, discount, isActive } = req.body;


        const promotion = await prisma.promotion.findUnique({
            where: { id: parseInt(id) },
        });

        if (!promotion) {
            res.status(404).send({ message: 'Promotion not found' });
            return;
        }


        const updatedPromotion = await prisma.promotion.update({
            where: { id: parseInt(id) },
            data: {
                name,
                discount,
                isActive,
            },
        });

        res.status(200).send({
            message: 'Promotion updated successfully',
            updatedPromotion,
        });
    } catch (err) {
        next(err);
    }
}


async function DeletePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { id } = req.params;

        const promotion = await prisma.promotion.findUnique({
            where: { id: parseInt(id) },
        });

        if (!promotion) {
            res.status(404).send({ message: 'Promotion not found' });
            return;
        }


        const deletedPromotion = await prisma.promotion.delete({
            where: { id: parseInt(id) },
        });

        res.status(200).send({
            message: 'Promotion deleted successfully',
            deletedPromotion,
        });
    } catch (err) {
        next(err);
    }
}

export { CreatePromotion, GetPromotions, GetPromotion, UpdatePromotion, DeletePromotion };