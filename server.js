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
    server.close(() => {
        process.exit(1);
    });
});
