"use client";

import { useState, useEffect, useRef } from "react";
import { Layout, Info } from "lucide-react";
import ThumbnailGallery from "./components/ThumbnailGallery";
import UploadForm from "./components/UploadForm";
import { uploadHeadshot, createJob, subscribeToJob, getJob, getAllThumbnails } from "../api";

const STYLES_LABELS: Record<string, string> = {
  bold_dramatic: "Bold & Dramatic",
  clean_minimal: "Clean & Minimal",
  vibrant_energetic: "Vibrant & Energetic"
}

export default function Home() {
  const [thumbnails, setThumbnails] = useState<any[]>([]);
  
  useEffect(() => {
    console.log('[Gallery State] Thumbnails updated:', thumbnails);
  }, [thumbnails]);

  const [jobStatus, setJobStatus] = useState("idle");
  const [error, setError] = useState<string | null>(null);
  // Tracks the active EventSource so we can close stale streams
  const activeEsRef = useRef<EventSource | null>(null);
  // REST poll fallback for already-completed thumbnails
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const hydrateThumbnails = (job: any) => {
    const completed = (job.thumbnails ?? []).filter((t: any) => t.status === 'completed');
    setThumbnails(prev => {
      const existing = new Set(prev.map((t: any) => t.id));
      const next = completed
        .filter((t: any) => !existing.has(t.id))
        .map((t: any) => ({
          id: t.id,
          styleName: t.style_name,
          styleLabel: STYLES_LABELS[t.style_name] || t.style_name,
          url: t.imagekit_url,
          status: 'ready',
          created_at: t.created_at || new Date().toISOString()
        }));
      // Prepend new thumbnails to show them at the top
      return next.length ? [...next, ...prev] : prev;
    });
    if (job.status === 'completed' || job.status === 'failed') {
      setJobStatus(job.status === 'completed' ? 'Completed' : 'Failed');
      stopPolling();
    }
  };

  // Restore last session's thumbnails on page load
  useEffect(() => {
    document.documentElement.classList.add('dark');

    const savedJobId = localStorage.getItem('lastJobId');
    if (savedJobId) {
      console.log('[Restore] Found saved job:', savedJobId);
      getJob(savedJobId)
        .then(job => {
          console.log('[Restore] Job status:', job.status, '| thumbnails:', job.thumbnails?.length);
          hydrateThumbnails(job);
          // If still processing, start polling to catch remaining completions
          if (job.status === 'processing' || job.status === 'pending') {
            setJobStatus('Generating...');
            pollRef.current = setInterval(async () => {
              try {
                const updated = await getJob(savedJobId);
                hydrateThumbnails(updated);
              } catch { stopPolling(); }
            }, 3000);
          }
        })
        .catch(() => {
          localStorage.removeItem('lastJobId');
          // Fallback to loading all thumbnails if job not found
          getAllThumbnails().then(data => {
            setThumbnails(data.map(t => ({
              id: t.id,
              styleName: t.style_name,
              styleLabel: STYLES_LABELS[t.style_name] || t.style_name,
              url: t.imagekit_url,
              status: 'ready'
            })));
          });
        });
    } else {
      // No active job, load history
      getAllThumbnails().then(data => {
        setThumbnails(data.map(t => ({
          id: t.id,
          styleName: t.style_name,
          styleLabel: STYLES_LABELS[t.style_name] || t.style_name,
          url: t.imagekit_url,
          status: 'ready'
        })));
      });
    }

    return () => { activeEsRef.current?.close(); stopPolling(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate({ file, prompt, numThumbnails }: { file: File, prompt: string, numThumbnails: number }) {
    // Close any previous stream/poll before starting a new job
    activeEsRef.current?.close();
    activeEsRef.current = null;
    stopPolling();

    setError(null);
    setJobStatus("Uploading...");

    try {
      const { url: headshotUrl } = await uploadHeadshot(file);

      setJobStatus("Creating Job...");
      const { job_id: jobId } = await createJob({ prompt, numThumbnails, headshotUrl });
      localStorage.setItem('lastJobId', jobId); // persist across refreshes

      setJobStatus("Generating...");

      // REST poll fallback — catches thumbnails already done before SSE opens
      pollRef.current = setInterval(async () => {
        try {
          const job = await getJob(jobId);
          console.log('[Poll] job status:', job.status, '| thumbnails:', job.thumbnails?.map((t: any) => ({ id: t.id, status: t.status })));
          hydrateThumbnails(job);
        } catch (e) {
          console.error('[Poll] failed to fetch job:', e);
        }
      }, 3000);

      const es = await subscribeToJob(jobId, {
        onThumbnailReady: (data: any) => {
          setJobStatus("Processing Variants...");
          setThumbnails((prev) => {
            if (prev.find(t => t.id === data.thumbnail_id)) return prev;
            const newThumb = {
              id: data.thumbnail_id,
              styleName: data.style_name,
              styleLabel: STYLES_LABELS[data.style_name] || data.style_name,
              url: data.imagekit_url,
              status: "ready",
              created_at: new Date().toISOString()
            };
            return [newThumb, ...prev];
          });
        },
        onThumbnailFailed: (err: any) => { console.error("Thumbnail failed:", err); },
        onJobComplete: () => { setJobStatus("Completed"); stopPolling(); activeEsRef.current = null; },
        onError: () => { /* SSE error — REST poll will keep hydrating */ }
      });
      activeEsRef.current = es;

    } catch (err: any) {
      const msg = err.message || "An error occurred";
      setError(msg.includes('Failed to fetch') ? "Backend unreachable. Make sure Express is running on port 3010." : msg);
      setJobStatus("Failed");
      stopPolling();
    }
  }
  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-7xl mx-auto px-8 py-12 space-y-16 w-full">
        {/* Results Section */}
        <div className="space-y-1">
          <h2 className="text-4xl font-black flex items-center gap-4 tracking-tighter">
            <Layout className="w-10 h-10 text-[#d9ff45]" />
            Viral Library
            <span className="text-sm font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/40 tracking-widest uppercase">
              {thumbnails.length} Designs
            </span>
          </h2>
          <p className="text-white/30 text-lg font-medium">Your collection of high-converting AI thumbnails</p>
        </div>

        <ThumbnailGallery thumbnails={thumbnails} />



        {error && (
          <div className="flex items-center gap-3 p-5 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
            <Info className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}
      </main>
      <section className="space-y-8">
        <div className="flex justify-between items-end border-b border-white/5 pb-8">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-bold uppercase tracking-wider">
            <span className={`w-2 h-2 rounded-full ${jobStatus === 'Completed' ? 'bg-green-500' :
              jobStatus === 'Failed' ? 'bg-red-500' :
                jobStatus === 'idle' ? 'bg-white/20' : 'bg-[#d9ff45] animate-pulse'
              }`} />
            {jobStatus}
          </div>
        </div>
      </section>


      <UploadForm
        onGenerate={handleGenerate}
        isGenerating={jobStatus !== "idle" && jobStatus !== "Completed" && jobStatus !== "Failed"}
      />
    </div>
  );
}
