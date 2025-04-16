const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB).then((con) => {
    console.log('DB connection successful!');
});

//READ JASON FILE
const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'),
);

//IMPORT DATA INTO DATABASE
const importData = async () => {
    try {
        await Tour.create(tours);
        console.log('Done uploding');
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

//DELETE ALL DATA FROM DB
const deleteData = async () => {
    try {
        await Tour.deleteMany({});
        console.log('Done Deleting');
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}
