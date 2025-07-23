import { createClient } from '@supabase/supabase-js';

export async function addVisitedRealm(userId: string, shareId: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SERVICE_ROLE!,
    );
    const { error } = await supabase
        .from('visited_realms')
        .insert([{ user_id: userId, realm_share_id: shareId }]);
    // Si el error es por duplicado, lo ignoramos
    if (error && !error.message.includes('duplicate key')) {
        throw error;
    }
} 