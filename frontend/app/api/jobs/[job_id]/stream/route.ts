/**
 * SSE Proxy Route
 *
 * Next.js rewrites() do NOT support long-lived SSE connections — they close
 * the stream immediately. This Route Handler manually pipes the Express SSE
 * stream back to the browser, keeping the connection alive for the full job.
 */

const BACKEND = process.env.API_URL || 'http://localhost:3010';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ job_id: string }> }
) {
    const { job_id } = await params;

    // Open a long-lived fetch to the Express SSE endpoint
    const upstream = await fetch(`${BACKEND}/api/jobs/${job_id}/stream`, {
        headers: {
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
        },
    });

    if (!upstream.body) {
        return new Response('Upstream stream unavailable', { status: 502 });
    }

    // Pipe the upstream body directly to the browser response
    return new Response(upstream.body, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
