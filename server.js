const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message);
    process.exit(1);
});

const app = require('./app');

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB).then((con) => {
    console.log('DB connection successful!');
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}.....`);
});

process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    //using .closs() to allow all the pending requests to still process until the end.
    server.close(() => {
        process.exit(1);
    });
});

//Railway 'll sutdown our app erery 24H by sending this signal
process.on('SIGTERM', () => {
    console.log('SIGTERM RECIEVED, Shuting down gracefully');
    //using .closs() to allow all the pending requests to still process until the end.
    server.close(() => {
        //we don't need to use exit manually because the SIGTERM itself 'll cause the server to shutdown
        console.log('Process terminated!');
    });
});
