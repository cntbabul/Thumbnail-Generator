
import { Sparkles } from "lucide-react"
const Header = () => {
    return (
        <nav className="px-8 py-8 flex justify-center items-center">
            <div className="flex items-center gap-3">
                <Sparkles size={48} className="text-[#d9ff45] mr-4" />
                <h1 className="text-5xl font-black tracking-tighter">Ai Thumbnail Generator</h1>
            </div>
        </nav>
    )
}
export default Header;