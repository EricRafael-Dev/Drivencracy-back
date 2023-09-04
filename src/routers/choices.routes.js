import { Router } from "express";
import { postChoice, postVote } from "../controllers/choices.controller.js";

const routerChoices = Router();

routerChoices.post("/choice", postChoice )
routerChoices.post("/choice/:id/vote", postVote )

export default routerChoices