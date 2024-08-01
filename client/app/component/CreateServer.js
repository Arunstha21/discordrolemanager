import { useEffect, useState } from "react";
const apiLink = "http://localhost:3001";

export default function CreateServer({ fetchServerList }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [serverName, setServerName] = useState("");
  const [template, setTemplate] = useState("");
  const [useTemplate, setUseTemplate] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const clearError = () =>{ 
    setInterval(() => {
    setError(null)
    }, 5000);
    }

    useEffect(() => {
        clearError();
    }, [error]);

  const handleSubmit = async () => {
    if (!serverName){
        setError("Server Name is required");
        return;
    };
    if (useTemplate && !template){
        setError("Template is required");
        return;
    };
    const data = {
      serverName,
      template
    };

    setIsCreating(true);
    try {
      const response = await fetch(`${apiLink}/api/createServer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      setIsCreating(false);

      if (response.ok) {
        const inviteLink = await response.json();
        setSuccess("Server created successfully", inviteLink);
        fetchServerList();
        setModalIsOpen(false);
      } else {
        console.error("Failed create Server: ", response.statusText);
      }
    } catch (error) {
      console.error("Failed create Server: ", error);
      setIsCreating(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setModalIsOpen(true)}
        className="bg-cyan-500 right-0 hover:bg-cyan-400 dark:hover:bg-cyan-600 text-white dark:bg-cyan-700 rounded-md px-4 mt-8 mr-8 py-2"
      >
        Create Server
      </button>
      {modalIsOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="dark:bg-indigo-400 p-8 bg-white rounded-lg shadow-lg w-96">
            <label className="block text-sm font-medium text-gray-700">Server Name</label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full px-3 py-2 mb-4 text-sm dark:text-gray-950 border rounded-lg"
            />
             <div className="flex mb-2">
                <input type="checkbox" checked={useTemplate} onChange={(e)=> setUseTemplate(e.target.checked)} />
                <label className="block text-sm font-medium text-gray-700">Use Template</label>
            </div>
            {useTemplate && (
                <div>
                <label className="block text-sm font-medium text-gray-700">Template Code</label>
                <input
                  type="text"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full px-3 py-2 mb-4 text-sm border dark:text-gray-950 rounded-lg"
                />
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className={`px-4 py-2 text-white rounded-lg transition mr-2 mb-2 ${
                isCreating ? "bg-gray-400" : "bg-green-500 hover:bg-green-700"
              }`}
            >
              {isCreating ? "Creating..." : "Create Server"}
            </button>
            <button
              onClick={() => setModalIsOpen(false)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition"
            >
              Close
            </button>
            {error && <div className="text-red-500">{error}</div>}
            {success && <div className="text-green-500">{success}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
