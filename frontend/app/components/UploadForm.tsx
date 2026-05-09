import { useRef, useState } from "react";
import { Sparkles, X, Plus } from "lucide-react";

interface UploadFormProps {
    onGenerate: (data: { file: File, prompt: string, numThumbnails: number }) => void;
    isGenerating: boolean;
}

const UploadForm = ({ onGenerate, isGenerating }: UploadFormProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("");
    const [numThumbnails, setNumThumbnails] = useState(3);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        console.log("Submit triggered:", { hasFile: !!file, prompt: prompt.trim(), numThumbnails });
        if (file && prompt.trim()) {
            onGenerate({ file, prompt: prompt.trim(), numThumbnails });
        }
    };

    const toggleThumbnails = () => {
        setNumThumbnails(prev => (prev % 3) + 1);
    };

    const isBtnDisabled = !file || !prompt.trim() || isGenerating;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-50">
            <form
                onSubmit={handleSubmit}
                className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 p-2 pl-4 rounded-3xl shadow-2xl flex items-center gap-6 transition-all duration-300 hover:border-white/20"
            >
                {/* Left: Image Card / Upload */}
                <div className="relative group shrink-0">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-[100px] h-[100px] rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${preview
                            ? 'border-[#d9ff45] overflow-hidden'
                            : 'border-[#d9ff45] hover:border-[#d9ff45]/40 hover:bg-[#d9ff45]/5'
                            }`}
                    >
                        {preview ? (
                            <>
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={clearFile}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </>
                        ) : (
                            <Plus size={20} className="text-[#d9ff45]/40" />
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                </div>

                {/* Vertical Divider */}
                <div className="h-12 w-px bg-white/10 shrink-0" />


                {/* Center: Prompt Input */}
                <div className="flex-1 min-w-0">

                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="What should happen in the thumbnail? (e.g. background of a space station)"
                        className="w-full bg-transparent border-none outline-none text-white text-lg placeholder:text-white/20 py-2"
                    />
                </div>

                {/* Settings / Controls */}
                <div className="hidden md:flex items-center gap-2 pr-2 border-r border-white/10">
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[12px] font-bold"
                    >
                        <span className="font-black">★</span> Pollinations Flux
                    </div>
                    <div
                        onClick={toggleThumbnails}
                        className="px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 text-[12px] font-bold text-white/60 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                        {numThumbnails}x
                    </div>
                </div>

                {/* Right: Generate Button */}
                <button
                    type="submit"
                    disabled={isBtnDisabled}
                    className={`h-14 px-8 rounded-2xl font-bold text-lg flex items-center gap-2 transition-all transform active:scale-95 shrink-0 ${
                        isBtnDisabled
                        ? 'bg-zinc-800 text-white/20 cursor-not-allowed shadow-none'
                        : 'bg-[#d9ff45] text-black hover:bg-[#c9ee3a] shadow-[0_0_20px_rgba(217,255,69,0.3)]'
                        }`}
                >
                    {isGenerating ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>Generate</span>
                            <Sparkles size={18} />
                        </>
                    )}
                </button>

            </form>
        </div>
    );
};

export default UploadForm;