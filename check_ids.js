
const { MongoClient, ObjectId } = require('mongodb');

async function checkIds() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('bd_shopify');
        const col = db.collection('orders');

        const docs = await col.find({}).limit(50).toArray();
        console.log('Sample IDs from bd_shopify/orders:');
        docs.forEach((doc, i) => {
            if (!(doc._id instanceof ObjectId)) {
                console.log(`NON-OBJECTID Doc ${i}:`, JSON.stringify(doc._id), 'Type:', typeof doc._id);
            }
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

checkIds();
