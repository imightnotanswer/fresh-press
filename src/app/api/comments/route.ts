import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseServer as supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rateLimit";
import { verifyHCaptcha } from "@/lib/hcaptcha";
import { processMarkdown } from "@/lib/markdown";
import { z } from "zod";

// --- add this helper near the top of the file ---
function getClientIp(req: NextRequest): string {
  // Vercel/Proxies put the original client IP first in x-forwarded-for
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "127.0.0.1"
  );
}

const commentSchema = z.object({
    postType: z.enum(["review", "media"]),
    postId: z.string(),
    parentId: z.string().optional(),
    body: z.string().min(1).max(2000),
    hcaptchaToken: z.string(),
});

export async function POST(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: "Comments system not configured" }, { status: 503 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { postType, postId, parentId, body: commentBody, hcaptchaToken } = commentSchema.parse(body);

        // Verify hCaptcha
        const isValidCaptcha = await verifyHCaptcha(hcaptchaToken);
        if (!isValidCaptcha) {
            return NextResponse.json({ error: "Invalid captcha" }, { status: 400 });
        }

        // Rate limiting
        const ip = getClientIp(request);
        const { success } = await rateLimit.limit(`comments:${ip}`); // optional namespace
        if (!success) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        // Process markdown
        const processedBody = await processMarkdown(commentBody);

        // Insert comment
        const { data, error } = await supabaseAdmin
            .from("comments")
            .insert({
                post_type: postType,
                post_id: postId,
                parent_id: parentId || null,
                user_id: session.user.id,
                body: processedBody,
            })
            .select()
            .single();

        if (error) {
            console.error("Error inserting comment:", error);
            return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in comments API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


