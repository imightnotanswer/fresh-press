// src/lib/supabase-server.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseServer = url && service ? createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
}) : null;