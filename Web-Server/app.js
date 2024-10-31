var mysql = require('mysql2/promise');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const { SerialPort } = require('serialport');
var fs = require('fs');

require('dotenv').config();

const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'myapp'
};

const port = new SerialPort({
    path: '/dev/cu.usbserial-1450',
    baudRate: 9600
});

const mailerSend = new MailerSend({
    apiKey: process.env.API_KEY,
});

const sentFrom = new Sender("MS_AbmNc2@trial-3zxk54v2k71ljy6v.mlsender.net", "FuzzTrapBeta Team");

let imageSize = null;
let imageBuffer = Buffer.alloc(0);

port.on('data', async function (data) {
    if (imageSize === null) {
        const dataString = data.toString();
        const newlineIndex = dataString.indexOf('\n');

        if (newlineIndex !== -1) {
            const sizeString = dataString.substring(0, newlineIndex).trim();
            imageSize = parseInt(sizeString, 10);

            if (isNaN(imageSize) || imageSize <= 0) {
                console.log(`Invalid image size received: ${sizeString}`);
                resetBuffer();
                return;
            }

            console.log(`Expected image size: ${imageSize} bytes`);
            const remainingData = data.slice(newlineIndex + 1);
            imageBuffer = Buffer.concat([imageBuffer, remainingData]);
        }
    } else {
        imageBuffer = Buffer.concat([imageBuffer, data]);

        if (imageBuffer.length >= imageSize) {
            try {
                const connection = await mysql.createConnection(dbConfig);
                const [result] = await connection.execute(
                    'INSERT INTO logs (image, timestamp) VALUES (?, NOW())', 
                    [imageBuffer.slice(0, imageSize)]
                );
                console.log('Image saved to database with ID:', result.insertId);
                await connection.end();

                resetBuffer();
                sendEmail();
            } catch (err) {
                console.error('Error saving image to database:', err);
            }
        }
    }
});

function resetBuffer() {
    imageSize = null;
    imageBuffer = Buffer.alloc(0);
    console.log('Buffer reset for the next image');
}

app.post('/send-to-serial', (req, res) => {
    const { command } = req.body;

    if (command === 2) {
        port.write('2', (err) => {
            if (err) {
                console.error('Error sending to serial port:', err);
                return res.status(500).json({ success: false, message: 'Failed to send command to ESP32' });
            }
            res.json({ success: true, message: '2 sent to ESP32' });
        });
    } else if (command === 3) {
        port.write('3', (err) => {
            if (err) {
                console.error('Error sending to serial port:', err);
                return res.status(500).json({ success: false, message: 'Failed to send command to ESP32' });
            }
            res.json({ success: true, message: '3 sent to ESP32' });
        });
    }
    else {
        res.status(400).json({ success: false, message: 'Invalid command' });
    }
});

async function sendEmail() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        const [users] = await connection.execute('SELECT email FROM users LIMIT 1');
        
        if (users.length === 0) {
            console.error("No users found in the database.");
            return;
        }

        const recipientEmail = users[0].email;

        const [logEntries] = await connection.execute('SELECT timestamp FROM logs ORDER BY timestamp DESC LIMIT 1');

        let latestTimestamp;
        if (logEntries.length > 0) {
            latestTimestamp = logEntries[0].timestamp;
        } else {
            console.error("No log entries found in the database.");
            await connection.end();
            return;
        }

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo([new Recipient(recipientEmail, "Alarm")])
            .setReplyTo(sentFrom)
            .setSubject("Alarm Activated")
            .setHtml(`Alarm Activated at: ${latestTimestamp}`)
            .setText(`Alarm Activated at: ${latestTimestamp}`);

        await mailerSend.email.send(emailParams);
        console.log("Email sent successfully to:", recipientEmail);
        
        await connection.end();
    } catch (err) {
        console.error("Error sending email:", err);
    }
}



module.exports = app;
