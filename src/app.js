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

app.get("/poll/:id/choice", async (req, res) => {
    const id = req.params.id

    try {

        const choices = await db.collection("choices").find({ pollId: new ObjectId(id) }).toArray();
        res.send(choices);

    } catch (err) {
        res.status(500).send(err.message)
    }
    
})

app.get("/poll/:id/result", async (req, res) => {
    const pollId = req.params.id;
    const listResult = []
    let moreVotes = null;

    function add(title, votes) {
        const addChoice = {
            title: title,
            votes: votes
        }
        listResult.push(addChoice)
        
    }

    try {
        const poll = await db.collection("polls").findOne({ _id: new ObjectId(pollId) });
        const choices = await db.collection("choices").find({ pollId: new ObjectId(pollId)}).toArray();

        await Promise.all(choices.map(async (choice) => {
            
            const votes = await db.collection("votes").find({ choiceId: choice._id}).toArray();

            add(choice.title, votes.length)
            
        }))

        for (const i of listResult) {
            if (moreVotes === null || i.votes > moreVotes.votes) {
                moreVotes = i;
            }
        }

        poll.result = moreVotes
        res.status(201).send(poll)

    } catch (err) {
        res.sendStatus(404)
    }
})

app.post("/choice", async (req, res) => {

    const { title, pollId } = req.body;
    const objPollId = new ObjectId(pollId)
    
    try {
        const today = dayjs()
        const dateFormated = today.format('YYYY-MM-DD HH:mm');

        const checkPoll = await db.collection("polls").findOne({ _id: new ObjectId(pollId) });
        const checkTitle = await db.collection("choices").findOne({ title, pollId });

        if (checkPoll == null) {
            return res.sendStatus(404)
        } else if (title == '') {
            return res.sendStatus(422)
        } else if (checkTitle){
            return res.sendStatus(409)
        } else if (checkPoll.expireAt<dateFormated) {
            return res.status(403).send('Poll expirada')
        }
        
        await db.collection("choices").insertOne({ title, pollId: objPollId });
        const choice = await db.collection("choices").findOne({ title, pollId: objPollId })
        res.status(201).send(choice);

    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post("/choice/:id/vote", async (req,res) => {
    const choiceId = req.params.id;
    const today = dayjs();
    const dateFormated = today.format('YYYY-MM-DD HH:mm');

    try {
        const checkChoice = await db.collection("choices").findOne({ _id: new ObjectId(choiceId) });
        const checkPoll = await db.collection("polls").findOne({ _id: new ObjectId(checkChoice.pollId) });

        if (checkPoll.expireAt<dateFormated) {
            return res.sendStatus(403)
        }

        await db.collection("votes").insertOne({ createdAt: dateFormated, choiceId: new ObjectId(choiceId) });
        res.sendStatus(201)

    } catch (err) {
        res.sendStatus(404)
    }
})



const PORT = 5000;
app.listen(PORT, () => console.log(`O servidor está rodando na porta ${PORT}!`))