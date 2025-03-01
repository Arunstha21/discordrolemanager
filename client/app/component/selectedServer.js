import { useEffect, useState } from "react";
import ImportMembers from "./import";
import CreateChannel from "./CreateChannel";
import ProvideRole from "./ProvideRole";
import Image from "next/image";
const apiLink = "https://discordrolemanager.onrender.com";

export default function SelectedServer({ server, closeSelectedServer }) {
    const [serverData, setServerData] = useState(null);
    const [error, setError] = useState(null);

    const fetchServerData = async () => {
        try {
          const response = await fetch(`${apiLink}/api/serverData/${server.id}`, {
            method: "GET",
          });
    
          if (response.ok) {
            const data = await response.json();
            setServerData(data);
          } else {
            setError("Failed to fetch data: ", response.statusText);
          }
        } catch (error) {
          setError("An error occurred while fetching data: ", error);
        }
      };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
          <div className="flex">
          <button className="px-4 py-2 text-white rounded-lg transition bg-indigo-500 hover:bg-indigo-700 mr-2" onClick={() => closeSelectedServer(null)}>Back</button>
            {server.icon ? (
              <Image
                src={server.icon}
                alt={server.shortName}
                className="w-16 h-16 bg-indigo-300 rounded-full"
              />
            ) : (
              <span className="text-4xl bg-gray-100 text-gray-950 rounded-full p-1 font-bold">
                {server.shortName}
              </span>
            )}
            <div className="ml-2">
            <h1 className="text-2xl font-bold">{server.name}</h1>
            <p className="text-muted-foreground text-sm">
              {server.memberCount} members
            </p>
          </div>
          </div>
          <div className="flex">
            <CreateChannel server={server} serverData={serverData} fetchServerData={fetchServerData}/>
            <ImportMembers />
            <ProvideRole server={server} serverData={serverData} fetchServerData={fetchServerData}/>
          </div>
      </div>
    </div>
  );
}
