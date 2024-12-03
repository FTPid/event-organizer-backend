import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { eventId, rating, comment } = req.body;
        const userId = req.user?.id;


        if (!userId || !eventId) {
            res.status(400).json({ message: 'User or Event ID is missing' });
        }


        if (rating < 1 || rating > 5) {
            res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Create a new rating record
        const newRating = await prisma.rating.create({
            data: {
                rating,
                comment: comment || null,
                eventId,
                userId: userId as number,
            },
        });

        res.status(201).json({
            message: "Rating created successfully",
            data: newRating,
        });
    } catch (error) {
        next(error);
    }
}

async function updateRating(req: Request, res: Response, next: NextFunction) {
    try {
        const { ratingId } = req.params;
        const { rating, comment } = req.body;

        const updatedRating = await prisma.rating.update({
            where: {
                id: parseInt(ratingId),
            },
            data: {
                rating,
                comment,
            },
        });

        res.status(200).json({
            message: "Rating updated successfully",
            data: updatedRating,
        });
    } catch (error) {
        next(error);
    }
}
async function deleteRating(req: Request, res: Response, next: NextFunction) {
    try {
        const { ratingId } = req.params;

        const deletedRating = await prisma.rating.delete({
            where: {
                id: parseInt(ratingId),
            },
        });

        res.status(200).json({
            message: "Rating deleted successfully",
            data: deletedRating,
        });
    } catch (error) {
        next(error);
    }
}
async function listRatings(req: Request, res: Response, next: NextFunction) {
    try {
        const ratings = await prisma.rating.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                event: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        startDate: true,
                        price: true,
                    },
                },
            },
        });

        res.status(200).json({
            message: "Ratings and event details retrieved successfully",
            data: ratings,
        });
    } catch (error) {
        next(error);
    }
}


export { createRating, updateRating, deleteRating, listRatings }
