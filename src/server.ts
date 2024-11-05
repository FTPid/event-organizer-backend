import express, { Application } from "express";
import { PORT as port } from "./utils/envConfig";
import cors from "cors";
import authRouter from "./routes/authRoutes";


import ErrorMiddleware from "./middlewares/error.middleware";

const PORT = Number(port) || 8000;

const app: Application = express();

app.use(cors());
app.use(express.json());


app.use("/auth-management", authRouter);

app.use(ErrorMiddleware);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
