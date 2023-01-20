const express = require('express')
const app = express()
const cors = require("cors")
require('dotenv').config();

app.use(cors)
app.use(express.json());

const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}!`))