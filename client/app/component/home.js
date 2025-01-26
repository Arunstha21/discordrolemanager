"use client";
import { useEffect, useState } from "react";
import ServerCard from "./serverCard";
import SelectedServer from "./selectedServer";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import CreateServer from "./CreateServer";
const apiLink = "https://discordrolemanager.onrender.com";

export default function Home() {
  const [serverList, setServerList] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);

  const fetchServerList = async () => {
    try {
      const response = await fetch(`${apiLink}/api/serverList`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setServerList(data);
      } else {
        console.error("Failed to fetch data: ", response.statusText);
      }
    } catch (error) {
      console.error("An error occurred while fetching data: ", error);
    }
  };

  useEffect(() => {
    fetchServerList();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-9xl">
      {selectedServer ? (
        <SelectedServer server={selectedServer} closeSelectedServer={setSelectedServer}/>
      ) : (
        <Card>
            <CardTitle className="flex m-3 text-3xl justify-center">Server List</CardTitle>
            <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {serverList.map((server) => (
            <ServerCard
              server={server}
              key={server.id}
              serverSelected={setSelectedServer}
            />
          ))}
        </div>
        <div className="flex justify-center m-5">
            <CreateServer fetchServerList={fetchServerList}/>
        </div>
            </CardContent>
        </Card>
        
      )}
    </div>
  );
}
