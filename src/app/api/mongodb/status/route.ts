import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const db = await getDb('admin');
        const serverStatus = await db.command({ serverStatus: 1 });

        // Extract relevant info for a phpMyAdmin-like view
        const status = {
            version: serverStatus.version,
            uptime: serverStatus.uptime,
            localTime: serverStatus.localTime,
            connections: serverStatus.connections,
            extra_info: serverStatus.extra_info,
            mem: serverStatus.mem,
            opcounters: serverStatus.opcounters,
            network: serverStatus.network,
        };

        return NextResponse.json(status);
    } catch (error: any) {
        console.error('Status error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch status' }, { status: 500 });
    }
}
