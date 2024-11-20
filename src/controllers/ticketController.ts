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





export { buyTicketWithPromotion };
