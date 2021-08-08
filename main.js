const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const express = require('express');
const cors = require('cors')

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const app = express()
app.use(cors())
app.use(express.json())

const credentials = JSON.parse(fs.readFileSync("credentials.json", "utf-8"))
const {client_id, client_secret, redirect_uris} = credentials.web
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

app.get("/", async (req, res) => {
    try {
        const tokenJson = fs.readFileSync("token.json", "utf-8")
        const tokens = JSON.parse(tokenJson)
        oAuth2Client.setCredentials(tokens)
        const calendar = google.calendar({version: 'v3', oAuth2Client});
        const result = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        })
        const events = result.data.items
        res.json(events)
    } catch (error) {
        res.redirect("oauth")
    }
})

app.get("/oauth", async (req, res) => {
    try {
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        })
        res.redirect(url)
    } catch(error) {
        console.log(error)
    }
})
app.get("/redirect", async (req, res)  => {
    try {
        const code = req.query["code"];
        const {tokens} = await oAuth2Client.getToken(code)
        console.log(tokens)
        fs.writeFileSync("token.json", JSON.stringify(tokens))
        oAuth2Client.setCredentials(tokens)
        const calendar = google.calendar({version: 'v3', auth: oAuth2Client});
        const result = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        })
        const events = result.data.items
        res.json(events)
    } catch (error) {
        console.log(error)
    }
})
app.listen(3000, () => {
    console.log("server start")
})
