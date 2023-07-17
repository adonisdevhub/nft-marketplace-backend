const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

/* File reading script */

const Character = require('./models/character');
const util = require('util');
const character_path = __dirname + '/characters/';

const convertName = (name) => {
    return parseInt(name.replace('.json', ''));
}

const fs = require('fs');
const readdirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);

async function processFiles() {
    let files = await readdirAsync(character_path);
    // console.log(files.length);
    files.map(async (file) => {
        let content = await readFileAsync(character_path + file, 'utf-8');
        let newValue = JSON.parse(content);
        let newCharacter = new Character({
            owner: '0x00000000000000000000000',
            cname: 'Ape',
            fname: convertName(file),
            name: newValue.name,
            image: newValue.image,
            attributes: newValue.attributes
        });
        await newCharacter.save().catch((e) => {
            console.log(e)
        });
    });
}

/* End file reading script */

const routes = require('./routes');
const config = require('./config');

const app = express();

const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/marketplace', routes);
app.use('/images', express.static('images'));

// processFiles();

mongoose
    .connect(config.mongoURL, {})
    .then(() => console.log("Mongodb connected!"))
    .catch((err) => console.log(err))

app.listen(port, () => console.log(`Server is running on port ${port}`));