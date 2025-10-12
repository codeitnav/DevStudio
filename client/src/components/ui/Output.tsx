import { useState, RefObject } from "react";
import { executeCode } from "../../lib/services/piston";
import type { editor } from "monaco-editor";
import { Save } from "lucide-react";

interface OutputProps {
  editorRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
  language: string;
  activeFile: string | null;
  isSaving: boolean;
  onSave: () => void;
}

interface Toast {
  title: string;
  description: string;
  status: "error" | "success" | "warning" | "info";
  duration: number;
}

const Output: React.FC<OutputProps> = ({
  editorRef,
  language,
  activeFile,
  isSaving,
  onSave,
}) => {
  const [output, setOutput] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (toastData: Toast) => {
    setToast(toastData);
    setTimeout(() => setToast(null), toastData.duration);
  };

  const runCode = async () => {
    const sourceCode = editorRef.current?.getValue();
    if (!sourceCode) return;
    
    try {
      setIsLoading(true);
      const { run: result } = await executeCode(language, sourceCode);
      setOutput(result.output.split("\n"));
      result.stderr ? setIsError(true) : setIsError(false);
    } catch (error: any) {
      console.log(error);
      showToast({
        title: "An error occurred.",
        description: error.message || "Unable to run code",
        status: "error",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4">
        <button
          className={`px-4 py-2 border-2 border-green-500 text-green-500 rounded-md hover:bg-green-500 hover:text-white transition-colors ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={runCode}
          disabled={isLoading}
        >
          {isLoading ? "Running..." : "Run Code"}
        </button>
        <button
          onClick={onSave} 
          disabled={!activeFile || isSaving} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
      <div
        className={`flex-grow p-2 border rounded ${ 
          isError
            ? "text-red-400 border-red-500"
            : "text-white border-gray-700"
        }`}
      >
        {output
          ? output.map((line, i) => <p key={i}>{line}</p>)
          : 'Click "Run Code" to see the output here'}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-md shadow-lg max-w-md">
          <h3 className="font-bold mb-1">{toast.title}</h3>
          <p className="text-sm">{toast.description}</p>
        </div>
      )}
    </div>
  );
};

export default Output;