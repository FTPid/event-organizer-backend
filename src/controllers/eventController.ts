import { Request, Response, NextFunction } from 'express';
import { PrismaClient, PaymentStatus } from '@prisma/client';
import { User } from '../custom';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage });
async function uploadPaymentProof(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;

    const image = req.file;
    if (!image) {
        res.status(400).send({
            message: "No image file provided"
        });
        return;
    }

    try {
        const imagePath = `images/${image.filename}`;


        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(id) }
        });

        if (!transaction) {
            res.status(404).send({
                message: "Transaction not found"
            });
            return;
        }


        await prisma.transaction.update({
            where: { id: parseInt(id) },
            data: {
                paymentProof: imagePath,
                paymentStatus: PaymentStatus.VERIFICATION,
            }
        });

        res.status(200).send({
            message: "Payment proof uploaded successfully",
            paymentProof: imagePath,
        });

    } catch (error) {
        next(error);
    }
}


async function CreateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    const {
        name,
        description,
        type,
        price,
        startDate,
        available_seat,
        locationId,
        categoryId
    } = req.body;

    try {
        const organizerId = (req.user as User)?.id;

        if (!organizerId) {
            res.status(403).send({ message: 'User must be authenticated to create an event.' });
            return;
        }

        const parsedPrice = Number(price);


        if (type === 'FREE' && parsedPrice !== 0) {
            res.status(400).send({ message: 'For FREE events, the price must be 0.' });
            return;
        }


        if (type === 'PAID' && (!parsedPrice || parsedPrice <= 0)) {
            res.status(400).send({ message: 'For PAID events, the price must be greater than 0.' });
            return;
        }

        const parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
            res.status(400).send({ message: "Invalid startDate format. Please use a valid ISO 8601 string." });
            return;
        }

        const imagePath = req.file ? `images/${req.file.filename}` : null;

        const event = await prisma.event.create({
            data: {
                name,
                description,
                type,
                price: type === 'FREE' ? 0 : parsedPrice,
                startDate: parsedStartDate,
                available_seat: Number(available_seat),
                organizerId,
                locationId: Number(locationId),
                categoryId: Number(categoryId),
                image: imagePath
            }
        });

        res.status(200).send({
            message: "Event created successfully",
            event
        });
    } catch (err) {
        next(err);
    }
}






async function GetEventLists(req: Request, res: Response, next: NextFunction) {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 8;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;

    try {
        const whereConditions: any = {};


        if (search && search.trim()) {
            whereConditions.name = { contains: search };
        }


        if (category && category.trim()) {
            whereConditions.category = { name: { contains: category } };
        }


        const totalEvents = await prisma.event.count({
            where: whereConditions,
        });


        const events = await prisma.event.findMany({
            where: whereConditions,
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                category: { select: { name: true } },
                organizer: { select: { name: true } },
                location: { select: { name: true } },
            },
        });

        const eventData = events.map(event => ({
            id: event.id,
            name: event.name,
            description: event.description,
            type: event.type,
            price: event.price,
            startDate: event.startDate,
            image: event.image ? `http://127.0.0.1:8000/${event.image}` : null,
            available_seat: event.available_seat,
            organizer: event.organizer?.name || null,
            location: event.location?.name || null,
            category: event.category?.name || null,
        }));

        res.status(200).send({
            message: 'success',
            data: eventData,
            pagination: {
                currentPage: page,
                pageSize,
                totalPages: Math.ceil(totalEvents / pageSize),
                totalEvents,
            },
        });
    } catch (err) {
        console.error('Error in GetEventLists:', err);
        next(err);
    }
}



async function ShowEvent(req: Request, res: Response, next: NextFunction) {
    const eventId = parseInt(req.params.id);

    try {
        const event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                category: { select: { name: true } },
                organizer: { select: { name: true } },
                location: { select: { name: true } }
            }
        });

        if (!event) {
            res.status(404).send({
                message: 'Event not found'
            });
            return;
        }

        res.status(200).send({
            message: 'Event retrieved successfully',
            event: {
                id: event.id,
                name: event.name,
                description: event.description,
                type: event.type,
                price: event.price,
                startDate: event.startDate,
                available_seat: event.available_seat,
                organizerName: event.organizer.name,
                locationName: event.location.name,
                categoryName: event.category.name
            }
        });
    } catch (err) {
        next(err);
    }
}


async function GetEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    const eventId = parseInt(req.params.id);

    try {
        const event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                category: { select: { name: true } },
                organizer: { select: { name: true } },
                location: { select: { name: true } }
            }
        });

        if (!event) {
            res.status(404).send({
                message: 'Event not found'
            });
            return;
        }

        res.status(200).send({
            message: 'Event retrieved successfully',
            event: {
                id: event.id,
                name: event.name,
                description: event.description,
                image: event.image,
                type: event.type,
                price: event.price,
                startDate: event.startDate,
                available_seat: event.available_seat,
                organizer: event.organizer.name,
                location: event.location.name,
                category: event.category.name
            }
        });
    } catch (err) {
        next(err);
    }
}

async function UpdateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const {
        name,
        description,
        type,
        price,
        startDate,
        available_seat,
        locationId,
        categoryId
    } = req.body;

    try {

        const existingEvent = await prisma.event.findUnique({
            where: { id: parseInt(id) }
        });


        if (!existingEvent) {
            res.status(404).send({ message: 'Event not found.' });
            return;
        }


        const organizerId = (req.user as User)?.id;
        if (!organizerId || organizerId !== existingEvent.organizerId) {
            res.status(403).send({
                message: 'User not authorized to update this event.'
            });
            return;
        }


        if (type === 'FREE' && price !== 0) {
            res.status(400).send({
                message: 'For FREE events, the price must be 0.'
            });
            return;
        }

        if (type === 'PAID' && (price === undefined || price <= 0)) {
            res.status(400).send({
                message: 'For PAID events, the price must be greater than 0.'
            });
            return;
        } let imagePath = existingEvent.image;
        if (req.file) {

            if (existingEvent.image) {
                const oldImagePath = path.join(__dirname, '../public', existingEvent.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            imagePath = `images/${req.file.filename}`;
        }


        const updatedEvent = await prisma.event.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                type,
                price: type === 'FREE' ? 0 : price,
                startDate: new Date(startDate),
                available_seat,
                locationId,
                categoryId,
                image: imagePath
            }
        });
        res.status(200).send({
            message: "Event updated successfully",
            updatedEvent
        });
    } catch (err) {
        next(err);
    }
}


async function DeleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        await prisma.$transaction(async (prisma) => {
            const data = await prisma.event.delete({
                where: { id: parseInt(id) }
            });

            res.status(200).send({
                message: "success",
                data
            });
        });
    } catch (err) {
        next(err)
    }

}

async function updatePaymentStatus(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(id) }
        });

        if (!transaction) {
            res.status(404).send({
                message: "Transaction not found"
            });
        }

        const updateTransaction = await prisma.transaction.update({
            where: { id: parseInt(id) },
            data: { paymentStatus: 'COMPLETED' },
        })

        res.status(200).send({
            message: "Transaction updated successfully",
        })
    } catch (error) {
        next(error)
    }
}



export {
    CreateEvent,
    GetEvent,
    ShowEvent,
    GetEventLists,
    UpdateEvent,
    DeleteEvent, upload,
    updatePaymentStatus,
    uploadPaymentProof
};
