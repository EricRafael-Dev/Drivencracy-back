import dayjs from "dayjs";
import { db } from "../database/database.connection.js";
import Joi from "joi";
import { ObjectId } from "mongodb";

export async function postPoll(req, res) {

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
    
}

export async function getPoll (req, res) {

    try {
        
        const polls = await db.collection("polls").find().toArray();
        res.send(polls);

    } catch (err) {
        res.status(500).send(err.message)
    }
}

export async function getPollChoices (req, res) {
    const id = req.params.id

    try {

        const choices = await db.collection("choices").find({ pollId: new ObjectId(id) }).toArray();
        res.send(choices);

    } catch (err) {
        res.status(500).send(err.message)
    }
    
}

export async function getResultPoll (req, res) {
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
}