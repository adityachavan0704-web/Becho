import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown } from "lucide-react"

const MORE_OPTIONS = ["Books", "Hardware", "Equipment", "Software", "Tutorials", "Lab Tools", "Furniture", "Mock Tests", "Projects"]

export default function SecondaryNav() {
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <div
      className="w-full flex items-center px-6 h-10 shadow-sm transition-all"
      style={{
        backgroundColor: "#112236", // Consistently dark blue theme like the reference image
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        color: "#ffffff"
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center gap-8 text-xs font-semibold tracking-wider">
        <button
          onClick={() => navigate("/browse?category=Electronics")}
          className="hover:text-primary transition-colors py-2 uppercase flex items-center h-10 border-b-2 border-transparent hover:border-primary"
        >
          Electronics
        </button>
        <button
          onClick={() => navigate("/browse?category=Notes")}
          className="hover:text-primary transition-colors py-2 uppercase flex items-center h-10 border-b-2 border-transparent hover:border-primary"
        >
          Notes
        </button>
        <button
          onClick={() => navigate("/browse?category=Cycles")}
          className="hover:text-primary transition-colors py-2 uppercase flex items-center h-10 border-b-2 border-transparent hover:border-primary"
        >
          Cycle
        </button>

        <div
          className="relative group h-10 flex items-center"
          onMouseEnter={() => setMoreOpen(true)}
          onMouseLeave={() => setMoreOpen(false)}
        >
          <button className="flex items-center gap-1 hover:text-primary transition-colors py-2 uppercase h-10 border-b-2 border-transparent group-hover:border-primary">
            More <ChevronDown className="h-3 w-3" />
          </button>

          {moreOpen && (
            <div
              className="absolute top-10 left-0 w-56 py-2 shadow-2xl z-50 rounded-b-md"
              style={{ backgroundColor: "#ffffff", color: "#333333", border: "1px solid #e5e7eb" }}
            >
              {MORE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => navigate(`/browse?category=${opt}`)}
                  className="block w-full text-left px-5 py-2.5 hover:bg-gray-100 transition-colors text-sm"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
