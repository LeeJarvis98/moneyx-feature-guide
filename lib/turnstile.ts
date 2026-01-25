/**
 * Verify Cloudflare Turnstile token on the server side
 * @param token - The token received from the client
 * @returns Promise<boolean> - True if verification succeeds
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is not configured');
    throw new Error('Captcha verification not configured');
  }

  if (!token) {
    return false;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}
