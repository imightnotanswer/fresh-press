export async function verifyHCaptcha(token: string): Promise<boolean> {
    const response = await fetch("https://hcaptcha.com/siteverify", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            secret: process.env.HCAPTCHA_SECRET!,
            response: token,
        }),
    });

    const data = await response.json();
    return data.success === true;
}


