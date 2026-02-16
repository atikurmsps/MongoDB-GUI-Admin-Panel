
const { ObjectId } = require('mongodb');

// Mock EJSON
const EJSON = {
    parse: (str) => JSON.parse(str)
};

function resolveIdQuery(id) {
    const filters = [];
    filters.push({ _id: id });
    let target = id;

    if (typeof id === 'string' && (id.trim().startsWith('{') || id.trim().startsWith('['))) {
        try {
            target = JSON.parse(id);
            filters.push({ _id: target });
        } catch (e) { }
    }

    try {
        if (typeof target === 'string') {
            if (ObjectId.isValid(target) && target.length === 24) {
                filters.push({ _id: new ObjectId(target) });
            }
        }
        else if (target && typeof target === 'object') {
            if (target.$oid && ObjectId.isValid(target.$oid)) {
                const oid = new ObjectId(target.$oid);
                filters.push({ _id: oid });
                filters.push({ _id: oid.toString() });
            }
            if (target.buffer) {
                const bytes = Object.values(target.buffer).filter(v => typeof v === 'number');
                if (bytes.length === 12) {
                    const hex = Buffer.from(bytes as number[]).toString('hex');
                    filters.push({ _id: new ObjectId(hex) });
                    filters.push({ _id: hex });
                }
            }
        }
    } catch (e) { }

    const uniqueFilters = filters.reduce((acc, curr) => {
        const str = JSON.stringify(curr);
        if (!acc.find(f => JSON.stringify(f) === str)) {
            acc.push(curr);
        }
        return acc;
    }, []);

    if (uniqueFilters.length === 1) return uniqueFilters[0];
    return { $or: uniqueFilters };
}

const testId = '{"$oid":"6945cd5054b616d899e8f4e8"}';
console.log('Query for EJSON string:', JSON.stringify(resolveIdQuery(testId)));

const testIdObject = { $oid: "6945cd5054b616d899e8f4e8" };
console.log('Query for object:', JSON.stringify(resolveIdQuery(testIdObject)));
