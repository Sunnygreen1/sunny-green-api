const express = require("express");
const axios = require("axios");
const sharp = require("sharp");
const cors=require("cors");
const _ = require('lodash');
const bodyParser = require('body-parser');
const fs = require('fs');
require('dotenv').config();
const app = express();

app.use(bodyParser.json());
app.use(cors());

app.listen(process.env.PORT||3000, () => {
    console.log(`Le serveur écoute sur le port 3000`);
  });

// Route pour avoir l'Image et la télécharger
app.get("/image", async (req, res) => {
    const zipCode = req.query.zipCode;
    const houseNumber = req.query.houseNumber;
    //Faire une requête à l'API pour télécharger l'image
    try {
        const response = await axios.get(`${process.env.API_URL}/map?zipcode=${zipCode}&house_number=${houseNumber}`, {
            responseType: "arraybuffer",
          });  
        const filename=zipCode;
        const imageBuffer = Buffer.from(response.data, "binary");
        const image = sharp(imageBuffer);
        image.toFile(`./images/${filename}.jpg`)
        res.set("Content-Type", "image/jpeg").send(imageBuffer);

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});
//Email sending

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/api/users', (req, res) => {
    const data = req.body;
    const formattedData = _.map(data, (value, key) => `${key}: ${value}`).join('\n');
    const msg = {
        to: `info@sunnygreen.nl`,
        from: `${process.env.EMAIL_SENDER}`,
        subject: 'New data received',
        text: formattedData,
    };
    sgMail
        .send(msg)
        .then(() => {
            res.status(201).json({ message: 'Data received and email sent successfully' });
        })
        .catch(error => {
            res.status(400).json({ message: 'An error occurred while sending the email', error });
        });
});


//Route pour supprimer les images à la fin

app.delete("/images", async (req, res) => {
    try {
        const files = fs.readdirSync('./images/');
        files.forEach(function(file, index){
            fs.unlinkSync('./images/' + file);
        });
        res.send("Tous les fichiers ont été supprimés.")
    } catch (err) {
        res.send(`Une erreur s'est produite: ${err}`);
    }
});