import { useEffect, useState } from "react";
import Papa from "papaparse";

export default function ImportMembers({ fetchTableData }) {
  const [csvData, setCsvData] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setCsvData(results.data);
      },
      error: (error) => {
        console.error("Error parsing CSV file:", error);
      },
    });
  };

  const clearError = () => {
    setInterval(() => {
      setError(null);
    }, 5000);
  };

  useEffect(() => {
    clearError();
  }, [error]);

  const handleSubmit = async () => {
    if (!csvData){
      setError("File not selected !");
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch("https://discordrolemanager.onrender.com/api/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(csvData),
      });

      setIsUploading(false);

      if (response.ok) {
        console.log("Data imported successfully");
        fetchTableData();
        setModalIsOpen(false);
      } else {
        console.error("Failed to import data");
      }
    } catch (error) {
      console.error("Error during data import:", error);
      setIsUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleData = [
      [
        "discordId",
        "teamName",
        "email",
        "guildId",
        "guildName",
        "tag",
        "role-player",
        "role-owner",
      ],
      [
        "rangotengo",
        "Strix",
        "rangotengo@gmail.com",
        "1097450117449125900",
        "2023 PMPL Spring - SAC",
        "st",
        "true",
        "true",
      ],
    ];
    const csvContent = sampleData.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = "sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <button
        onClick={() => setModalIsOpen(true)}
        className="bg-indigo-500 hover:bg-indigo-700 text-white rounded-md mr-2 px-4 py-2"
      >
        Import Members Data
      </button>
      {modalIsOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="dark:bg-indigo-400 p-8 bg-white rounded-lg shadow-lg w-96">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Upload file
            </label>
            <input
              className="block w-full text-sm text-gray-900 border mb-2 border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
              accept=".csv"
              onChange={handleFileUpload}
              type="file"
            />
            <button
              onClick={handleDownloadSample}
              className="px-4 py-2 bg-gray-500 text-white mr-2 rounded-lg hover:bg-gray-700 transition mb-2"
            >
              Download Sample File
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className={`px-4 py-2 text-white rounded-lg transition mr-2 mb-2 ${
                isUploading ? "bg-gray-400" : "bg-green-500 hover:bg-green-700"
              }`}
            >
              {isUploading ? "Importing..." : "Import"}
            </button>
            <button
              onClick={() => setModalIsOpen(false)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition"
            >
              Close
            </button>
            {error && <div className="text-red-500">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
