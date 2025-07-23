import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
    const url = new URL(req.url!);
    const realm_share_id = url.searchParams.get('realm_share_id');
    if (!realm_share_id) {
        return NextResponse.json([]);
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SERVICE_ROLE!
    );

    // 1. Obtener user_ids de visited_realms
    const { data: visited } = await supabase
        .from('visited_realms')
        .select('user_id, visited_at')
        .eq('realm_share_id', realm_share_id);

    if (!visited) return NextResponse.json([]);

    // 2. Para cada user_id, obtener el usuario de Auth
    const members = [];
    for (const v of visited) {
        const { data: user } = await supabase.auth.admin.getUserById(v.user_id);
        members.push({
            id: v.user_id,
            display_name: user?.user?.user_metadata?.full_name || user?.user?.user_metadata?.name || user?.user?.email || v.user_id,
            visited_at: v.visited_at
        });
    }
    return NextResponse.json(members);
} 