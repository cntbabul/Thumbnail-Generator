export const API_URL = "/api";

export interface CreateJobParams {
    prompt: string;
    numThumbnails: number;
    headshotUrl: string;
}

export interface JobCallbacks {
    onThumbnailReady: (data: any) => void;
    onThumbnailFailed: (data: any) => void;
    onJobComplete: (data: any) => void;
    onError: (error: any) => void;
}

export async function uploadHeadshot(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/upload-headshot`, {
        method: "POST",
        body: form,
    });
    if (!res.ok) {
        throw new Error("Failed to upload headshot");
    }
    return res.json();
}

export async function createJob({ prompt, numThumbnails, headshotUrl }: CreateJobParams): Promise<{ job_id: string }> {
    const res = await fetch(`${API_URL}/jobs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt,
            num_thumbnails: numThumbnails,
            headshot_url: headshotUrl,
        })
    })
    if (!res.ok) {
        throw new Error("Failed to create job");
    }
    return res.json();
}

export async function getAllThumbnails(): Promise<any[]> {
    const res = await fetch(`${API_URL}/thumbnails`);
    if (!res.ok) throw new Error('Failed to fetch thumbnails');
    return res.json();
}

export async function getJob(jobId: string): Promise<any> {
    const res = await fetch(`${API_URL}/jobs/${jobId}`);
    if (!res.ok) throw new Error('Failed to fetch job');
    return res.json();
}

export async function subscribeToJob(
    jobId: string, 
    { onThumbnailReady, onThumbnailFailed, onJobComplete, onError }: JobCallbacks
): Promise<EventSource> {
    const es = new EventSource(`${API_URL}/jobs/${jobId}/stream`);

    es.addEventListener("thumbnail_ready", (event: any) => {
        onThumbnailReady(JSON.parse(event.data));
    })
    es.addEventListener("thumbnail_failed", (event: any) => {
        onThumbnailFailed(JSON.parse(event.data));
    })
    es.addEventListener("job_completed", (event: any) => {
        onJobComplete(JSON.parse(event.data));
        es.close()
    })
    es.addEventListener("error", (event: any) => {
        onError(event);
        es.close();
    })
    return es;
}