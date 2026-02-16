
const { MongoClient, ObjectId } = require('mongodb');

async function deleteOne() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('bd_shopify');
        const col = db.collection('orders');

        const doc = await col.findOne({});
        if (!doc) {
            console.log('No documents found in bd_shopify/orders');
            return;
        }

        console.log('Attempting to delete doc with ID:', doc._id, 'Type:', typeof doc._id);

        const result = await col.deleteOne({ _id: doc._id });
        console.log('Delete result:', result.deletedCount === 1 ? 'SUCCESS' : 'FAILED');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

deleteOne();
