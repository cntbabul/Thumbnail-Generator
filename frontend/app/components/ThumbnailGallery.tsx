import { ExternalLink, Download, ImageOff, Sparkles, Clock } from 'lucide-react'

interface Thumbnail {
    url: string;
    id: string;
    styleName: string;
    styleLabel: string;
    status: string;
    created_at?: string;
}

interface ThumbnailGalleryProps {
    thumbnails: Thumbnail[];
}

const ThumbnailGallery = ({ thumbnails }: ThumbnailGalleryProps) => {
    if (thumbnails.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 px-6 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-2xl transition-all animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 bg-[#d9ff45]/10 rounded-3xl flex items-center justify-center mb-8 ring-1 ring-[#d9ff45]/20 shadow-[0_0_50px_-12px_rgba(217,255,69,0.3)]">
                    <ImageOff className="w-10 h-10 text-[#d9ff45]" />
                </div>
                <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Gallery Empty</h3>
                <p className="text-white/40 text-center max-w-sm text-lg font-medium leading-relaxed">
                    Ready to go viral? Upload your headshot and let the AI craft your next masterpiece.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {thumbnails.map((thumb, index) => (
                <div
                    key={thumb.id}
                    className="group relative bg-[#1a1a1a] rounded-[2.5rem] overflow-hidden shadow-2xl hover:shadow-[#d9ff45]/5 transition-all duration-700 border border-white/5 hover:border-[#d9ff45]/30 animate-in fade-in slide-in-from-bottom-8"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    {/* Floating Style Badge */}
                    <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
                         <div className="px-4 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 shadow-2xl">
                            <Sparkles className="w-3 h-3 text-[#d9ff45]" />
                            <span className="text-[11px] font-black text-white uppercase tracking-wider">
                                {thumb.styleLabel}
                            </span>
                        </div>
                    </div>

                    {/* Image Container */}
                    <div className="aspect-[16/10] overflow-hidden bg-[#111]">
                        <img
                            src={thumb.url}
                            alt={thumb.styleLabel}
                            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1"
                        />
                        {/* Shimmer Effect on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#d9ff45]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>

                    {/* Footer Info */}
                    <div className="p-6 bg-gradient-to-b from-transparent to-black/90">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h4 className="text-white font-black text-lg tracking-tight group-hover:text-[#d9ff45] transition-colors">
                                    {thumb.styleLabel} Variant
                                </h4>
                                <div className="flex items-center gap-2 text-white/30 text-[11px] font-bold uppercase tracking-widest">
                                    <Clock className="w-3 h-3" />
                                    {thumb.created_at ? new Date(thumb.created_at).toLocaleDateString() : 'Just now'}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <a
                                    href={thumb.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl transition-all hover:scale-110 active:scale-95 group/btn shadow-xl"
                                    title="View Original"
                                >
                                    <ExternalLink className="w-5 h-5 group-hover/btn:text-[#d9ff45] transition-colors" />
                                </a>
                                <a
                                    href={thumb.url}
                                    download
                                    className="p-3 bg-[#d9ff45] hover:bg-[#c4e63e] text-black rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-[0_10px_20px_-10px_rgba(217,255,69,0.5)]"
                                    title="Download"
                                >
                                    <Download className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Status Overlay */}
                    {thumb.status !== 'ready' && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-30">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-[#d9ff45]/20 border-t-[#d9ff45] rounded-full animate-spin" />
                                    <Sparkles className="w-4 h-4 text-[#d9ff45] absolute inset-0 m-auto animate-pulse" />
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-white font-black text-xs tracking-[0.2em] uppercase animate-pulse">Generating...</span>
                                    <span className="text-white/30 text-[10px] font-bold uppercase">Crafting Pixel Perfection</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default ThumbnailGallery