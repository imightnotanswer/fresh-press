import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        console.log('Avatar upload request received');
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!supabase) return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });

        // read multipart form
        const form = await request.formData();
        const file = form.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });

        console.log('Avatar upload file received:', { fileName: file.name, fileSize: file.size, fileType: file.type });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const path = `${session.user.id}.${ext}`;

        // upload to public bucket 'avatars'
        console.log('Uploading avatar to storage:', { path, contentType: file.type || 'image/png' });
        const { error: upErr } = await (supabase as any).storage
            .from('avatars')
            .upload(path, buffer, {
                contentType: file.type || 'image/png',
                upsert: true,
            });
        if (upErr) {
            console.error('avatar upload error', upErr);
            return NextResponse.json({ error: 'Failed to upload' }, { status: 500 });
        }
        console.log('Avatar uploaded successfully to storage');

        const urlBase = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const publicUrl = `${urlBase}/storage/v1/object/public/avatars/${encodeURIComponent(path)}`;

        // save to profile
        console.log('Saving avatar to profile:', { userId: session.user.id, avatarUrl: publicUrl });
        const { error: profErr } = await supabase
            .from('user_profiles')
            .upsert({ id: session.user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'id' });
        if (profErr) {
            console.error('avatar profile save error', profErr);
            return NextResponse.json({ error: 'Failed to save avatar' }, { status: 500 });
        }
        console.log('Avatar saved successfully to profile');

        return NextResponse.json({ success: true, url: publicUrl });
    } catch (e) {
        console.error('avatar error', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}



