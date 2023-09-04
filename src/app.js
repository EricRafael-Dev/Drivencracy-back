import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routerChoices from "./routers/choices.routes.js";
import routerPolls from "./routers/polls.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
dotenv.config();

app.use(routerChoices);
app.use(routerPolls);

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`O servidor está rodando na porta ${port}!`))