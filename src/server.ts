import express, { Application } from "express";
import { PORT as port } from "./utils/envConfig";
import cors from "cors";
import authRouter from "./routes/authRoutes";
import categoryRouter from "./routes/categoryRoutes"
import locationRouter from "./routes/locationRoutes"
import eventRouter from "./routes/eventRoutes"
import promotionRouter from "./routes/promotionRoutes"
import ticketRouter from "./routes/ticketRoutes"

import ErrorMiddleware from "./middlewares/error.middleware";
import { VerifyToken } from "./middlewares/authMiddleware";
import path from "path";

const PORT = Number(port) || 8000;

const app: Application = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '../public/images')));


app.use("/auth-management", authRouter);
app.use("/categories", VerifyToken, categoryRouter);
app.use("/locations", VerifyToken, locationRouter);
app.use("/events", eventRouter);
app.use('/promotions', VerifyToken, promotionRouter);
app.use('/tickets', VerifyToken, ticketRouter);

app.use(ErrorMiddleware);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
