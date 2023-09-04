import dayjs from "dayjs";
import { db } from "../database/database.connection.js";
import { ObjectId } from "mongodb";

export async function postChoice (req, res) {

    const { title, pollId } = req.body;
    const objPollId = new ObjectId(pollId)
    
    try {
        const today = dayjs()
        const dateFormated = today.format('YYYY-MM-DD HH:mm');

        const checkPoll = await db.collection("polls").findOne({ _id: new ObjectId(pollId) });
        const checkTitle = await db.collection("choices").findOne({ title, pollId: new ObjectId(pollId) });

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
}

export async function postVote (req,res) {
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
}