
const { EJSON } = require('bson');
const { ObjectId } = require('mongodb');

const data = [
    { _id: new ObjectId("6945cd5054b616d899e8f4e8"), name: "test" }
];

console.log('Relaxed EJSON:', EJSON.stringify(data, { relaxed: true }));
console.log('Parsed Relaxed:', JSON.parse(EJSON.stringify(data, { relaxed: true })));
