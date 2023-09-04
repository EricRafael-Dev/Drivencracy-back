import { Router } from "express";
import { getPoll, getPollChoices, getResultPoll, postPoll } from "../controllers/polls.controller.js";

const routerPolls = Router();

routerPolls.post("/poll", postPoll );
routerPolls.get("/poll", getPoll );
routerPolls.get("/poll/:id/choice", getPollChoices );
routerPolls.get("/poll/:id/result", getResultPoll );

export default routerPolls