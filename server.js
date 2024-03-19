import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import connect from './database/conn.js'
import router from './router/route.js'
import dotenv from 'dotenv'
// import ENV from './config.js'
const app = express()


// middlewares
dotenv.config()
app.use(express.json())
app.use(cors())
app.use(morgan('tiny'))
app.disable('x-powered-by') //less hackers know about our stack
const ENV = process.env;
console.log(ENV.EMAIL_USERNAME)
// console.log(ENV.EMAIL_USERNAME)
const port = process.env.PORT || 8000;

// HTTP GET Request
app.get('/', (req, res) => {
    res.status(201).send('SERVER IS RUNNING')
})

// const allowedIPs = ENV.ALLOWED_IPS;

// Middleware to check if request is coming from allowed IP addresses
const allowOnlyFromAllowedIPs = (req, res, next) => {
    const clientIP = req.ip.replace('::ffff:', '');
    // console.log(clientIP);
    if (!ENV.ALLOW_ONLY_ALLOWED_IPS) {
        next(); // Allow request to proceed
    } else {
        res.status(403).send(
            '<img style="position:absolute; left:50%; top:50%; transform: translate(-50%, -50%);" src="https://media.tenor.com/jiXga9K9xbMAAAAM/nikal-laude-nikal-lavde.gif"></img>'
        );
    }
};
// api routes
app.use('/api', router)

app.use((req, res, next) => {
    res.status(404).send('<div style="position:absolute; left:50%; top:50%; transform: translate(-50%, -50%);"><img src="https://c.tenor.com/1-qDMRlzUn4AAAAd/tenor.gif"></img><h1 style="color:white; width:100%; text-align:center; position:absolute; bottom:1vh;">Hum pe to haie noo</h1></div>');
});

// start server only when we have valid connection
connect().then(() => {
    try {
        app.listen(port, () => {
            console.log(`Server connected to  http://localhost:${port}`)
        })
    } catch (error) {
        console.log("Can\'t connect to the server");
    }
}).catch(error => {
    console.log('Invalid database connection!');
})