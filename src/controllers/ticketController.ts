import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function buyTicketWithPromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { userId, eventId, promoCode, seatCount } = req.body;

    try {
        if (!Number.isInteger(seatCount) || seatCount <= 0) {
            res.status(400).send({ message: 'Invalid seat count. Must be a positive integer.' });
            return;
        }

        // Check if the user has already bought a ticket for the event
        const existingTickets = await prisma.ticket.findMany({
            where: {
                eventId,
                User: {
                    some: { id: userId }
                }
            },
        });

        if (existingTickets.length > 0) {
            res.status(400).send({ message: 'You have already purchased a ticket for this event.' });
            return;
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            res.status(404).send({ message: 'Event not found' });
            return;
        }

        if (event.available_seat < seatCount) {
            res.status(400).send({ message: `Only ${event.available_seat} seats are available.` });
            return;
        }

        // Handle free event (price 0)
        if (!event.price || event.price === 0) {
            const transaction = await prisma.transaction.create({
                data: {
                    userId,
                    eventId,
                    totalAmount: 0,
                    discount: 0,
                    paymentStatus: 'COMPLETED',
                },
            });

            const tickets = [];
            for (let i = 0; i < seatCount; i++) {
                const ticket = await prisma.ticket.create({
                    data: {
                        eventId,
                        transactionId: transaction.id,
                        User: {
                            connect: { id: userId },
                        },
                    },
                });
                tickets.push(ticket);
            }

            await prisma.event.update({
                where: { id: eventId },
                data: {
                    available_seat: event.available_seat - seatCount,
                },
            });

            res.status(200).send({
                message: `Successfully claimed ${seatCount} free ticket(s)`,
                transaction,
                tickets,
            });
            return;
        }

        let promotion = null;
        let discountPerSeat = 0;
        let totalAmount = event.price * seatCount;

        // Check for promotion
        if (promoCode) {
            promotion = await prisma.promotion.findFirst({
                where: {
                    referralCode: promoCode,
                    eventId: eventId,
                    isActive: true,
                },
            });

            if (!promotion) {
                res.status(400).send({ message: 'Invalid or expired promotion code.' });
                return;
            }

            // Ensure the promotion is used only once per user
            if (promotion.usedCount + seatCount > (promotion.usageLimit || 0)) {
                res.status(400).send({ message: 'Promotion usage limit exceeded.' });
                return;
            }

            discountPerSeat = promotion.type === 'DISCOUNT' ? promotion.discount : 0;
            totalAmount = Math.max((event.price - discountPerSeat) * seatCount, 0);

            await prisma.promotion.update({
                where: { id: promotion.id },
                data: {
                    usedCount: promotion.usedCount + seatCount,
                },
            });
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                eventId,
                totalAmount,
                discount: discountPerSeat * seatCount,
                referralCode: promoCode || null,
                promotionId: promotion ? promotion.id : null,
                paymentStatus: 'PENDING',
            },
        });

        const tickets = [];
        for (let i = 0; i < seatCount; i++) {
            const ticket = await prisma.ticket.create({
                data: {
                    eventId,
                    transactionId: transaction.id,
                    User: {
                        connect: { id: userId },
                    },
                },
            });
            tickets.push(ticket);
        }

        await prisma.event.update({
            where: { id: eventId },
            data: {
                available_seat: event.available_seat - seatCount,
            },
        });

        res.status(200).send({
            message: `Successfully purchased ${seatCount} ticket(s)`,
            transaction,
            tickets,
        });
    } catch (err) {
        console.error('Error during ticket purchase:', err);
        next(err);
    }
}





async function getTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(400).send({ message: 'User is not authenticated' });
            return;
        }

        const { page, pageSize } = req.query;

        const currentPage = parseInt(page as string) || 1;
        const size = parseInt(pageSize as string) || 10;

        const skip = (currentPage - 1) * size;
        const take = size;


        const transactions = await prisma.transaction.findMany({
            where: { userId: userId },
            select: {
                id: true,
                totalAmount: true,
                discount: true,
                referralCode: true,
                promotionId: true,
                paymentStatus: true,
                createdAt: true,
                user: {
                    select: {
                        name: true,
                    },
                },
                event: {
                    select: {
                        name: true,
                        id: true,  // Ensure event ID is selected
                    },
                },
            },
            skip,
            take,
        });

        const totalTransactions = await prisma.transaction.count({
            where: { userId: userId },
        });

        const totalPages = Math.ceil(totalTransactions / size);

        const transformedTransactions = transactions.map((transaction) => ({
            id: transaction.id,
            userName: transaction.user.name,
            eventName: transaction.event.name,
            eventId: transaction.event.id,
            totalAmount: transaction.totalAmount,
            discount: transaction.discount,
            referralCode: transaction.referralCode,
            promotionId: transaction.promotionId,
            paymentStatus: transaction.paymentStatus,
            createdAt: transaction.createdAt,
        }));

        res.status(200).send({
            message: 'Transactions retrieved successfully',
            data: transformedTransactions,
            pagination: {
                currentPage,
                pageSize: size,
                totalPages,
                totalTransactions,
            },
        });
    } catch (err) {
        next(err);
    }
}



export const getTicketByTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;


        const transactionId = parseInt(id);
        if (isNaN(transactionId)) {
            res.status(400).json({ message: "Invalid transaction ID" });
            return;
        }


        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                Ticket: true,
                event: {
                    include: {
                        organizer: {
                            select: {
                                name: true,
                            },
                        },
                        location: {
                            select: {
                                name: true,
                            },
                        },
                        category: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });


        if (!transaction) {
            res.status(404).json({ message: "Transaction not found" });
            return;
        }


        res.status(200).json({
            ticket: transaction.Ticket,
            event: {
                id: transaction.event.id,
                image: transaction.event.image ? `http://127.0.0.1:8000/${transaction.event.image}` : null,
                name: transaction.event.name,
                description: transaction.event.description,
                type: transaction.event.type,
                price: transaction.totalAmount,
                startDate: transaction.event.startDate,
                available_seat: transaction.event.available_seat,
                organizer: transaction.event.organizer.name,
                location: transaction.event.location.name,
                category: transaction.event.category.name,
            }
        });
    } catch (error) {
        next(error);
    }
};





export { buyTicketWithPromotion, getTransaction };
