import { ChevronDown } from "lucide-react";
import { LANGUAGE_VERSIONS } from "../../constants";
import { useState, useRef, useEffect } from "react";

const languages = Object.entries(LANGUAGE_VERSIONS);
const ACTIVE_COLOR = "#60a5fa"; // blue-400 equivalent

interface LanguageSelectorProps {
  language: string;
  onSelect: (lang: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="ml-2 mb-4" ref={menuRef}>
      <p className="mb-2 text-lg">Language:</p>
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-gray-800 text-white rounded-md flex items-center gap-2 hover:bg-gray-700 transition-colors"
        >
          {language}
          <ChevronDown size={16} />
        </button>
        {isOpen && (
          <div className="absolute mt-1 bg-[#110c1b] rounded-md shadow-lg min-w-[200px] max-h-[300px] overflow-y-auto z-10 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {languages.map(([lang, version]) => (
              <button
                key={lang}
                onClick={() => {
                  onSelect(lang);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-900 transition-colors"
                style={{
                  color: lang === language ? ACTIVE_COLOR : "inherit",
                  backgroundColor:
                    lang === language ? "#1a1a1a" : "transparent",
                }}
              >
                {lang}
                &nbsp;
                <span className="text-gray-600 text-sm">({version})</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSelector;
