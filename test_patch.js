
const { MongoClient, ObjectId } = require('mongodb');

async function testPatch() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('bd_shopify');
        const col = db.collection('orders');

        const doc = await col.findOne({});
        if (!doc) {
            console.log('No documents found');
            return;
        }

        console.log('Found doc:', doc._id);
        const idStr = doc._id.toString();

        // Simulating the API logic
        const query = { _id: new ObjectId(idStr) };
        const update = { $set: { test_field: "updated_" + Date.now() } };

        const result = await col.updateOne(query, update);
        console.log('Update result:', result.matchedCount === 1 ? 'MATCHED' : 'NOT MATCHED', 'Modified:', result.modifiedCount);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

testPatch();
