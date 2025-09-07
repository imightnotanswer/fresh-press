import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json({
                error: "RESEND_API_KEY not configured",
                message: "Please set up Resend API key in your environment variables"
            }, { status: 500 });
        }

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: email,
            subject: "Test Email from Fresh Press",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">Test Email</h1>
                    <p>This is a test email from Fresh Press to verify your email configuration.</p>
                    <p>If you received this email, your Resend setup is working correctly!</p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json({ error: "Failed to send email", details: error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Test email sent successfully",
            data
        });
    } catch (error) {
        console.error("Error sending test email:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
