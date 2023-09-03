import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import { db } from "./database/database.connection.js";
import Joi from "joi";
import { ObjectId } from "mongodb";

const app = express();

app.use(cors());
app.use(express.json());


app.post("/poll", async (req, res) => {

    let newExpireAt;

    const schemaPoll = Joi.object({
        title: Joi.string().required(),
        expireAt: Joi.string().optional()
    })

    const { title, expireAt } = req.body;
    const poll = { title, expireAt }

    const validation = schemaPoll.validate(poll, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    if (!expireAt) {
        const today = dayjs().add(1, 'month');
        const dateFormated = today.format('YYYY-MM-DD HH:mm');
        newExpireAt = dateFormated
    } else {
        newExpireAt = expireAt
    }

    try {
        await db.collection("polls").insertOne({ title, expireAt: newExpireAt });
        const poll = await db.collection("polls").findOne({ title, expireAt: newExpireAt })
        res.status(201).send(poll);
    } catch (err) {
        res.status(500).send(err.message);
    }
    
})

app.get("/poll", async (req, res) => {

    try {

        const polls = await db.collection("polls").find().toArray();
        res.send(polls);

    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post("/choice", async (req, res) => {

    const { title, pollId } = req.body;
    
    try {
        const checkPoll = await db.collection("polls").findOne({ _id: new ObjectId(pollId) });
        const checkTitle = await db.collection("choices").findOne({ title, pollId });
        if (checkPoll == null) {
            return res.sendStatus(404)
        } else if (title == '') {
            return res.sendStatus(422)
        } else if (checkTitle){
            return res.sendStatus(409)
        }
        
        
        await db.collection("choices").insertOne({ title, pollId });
        res.sendStatus(201);

    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("/poll/:id/choice", async (req, res) => {
    const id = req.params.id

try {

    const choices = await db.collection("choices").find({ pollId: id }).toArray();
    res.send(choices);

} catch (err) {
    res.sendStatus(404)
}
    
})

const PORT = 5000;
app.listen(PORT, () => console.log(`O servidor está rodando na porta ${PORT}!`))