
const { ObjectId } = require('mongodb');

const o1 = { _id: "6945cd5054b616d899e8f4e8" };
const o2 = { _id: new ObjectId("6945cd5054b616d899e8f4e8") };

console.log('Str 1:', JSON.stringify(o1));
console.log('Str 2:', JSON.stringify(o2));
console.log('Equal?', JSON.stringify(o1) === JSON.stringify(o2));
