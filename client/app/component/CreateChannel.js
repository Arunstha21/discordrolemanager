import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "./ui/dropdownMenu";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/Card";
const apiLink = "https://discordrolemanager.onrender.com";

export default function CreateChannel({ server,serverData, fetchServerData }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [serverRoles, setServerRoles] = useState([]);
  const [serverCategories, setServerCategories] = useState([]);
  const [channels, setChannels] = useState([]);
  const [newChannel, setNewChannel] = useState("");
  const [selectedCategory, setSelectedCategory] = useState({
    name: "Select Category",
  });

  const clearError = () => {
    setInterval(() => {
        setError(null);
    }, 5000);
    };

    useEffect(() => {
        clearError();
    }, [error]);

  useEffect(() => {
    setServerRoles(serverData?.roles);
    setServerCategories(serverData?.categories);
    const newChannels = serverData?.categories.reduce((acc, category) => {
      acc[category.id] = {
        categoryName: category.name,
        channels: [],
      };
      return acc;
    }, {});

    setChannels((prev) => ({
      ...prev,
      ...newChannels,
    }));
  }, [serverData]);

  function openModal() {
    setModalIsOpen(true);
    fetchServerData();
  }

  const handleSubmit = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`${apiLink}/api/createChannels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId: server.id,
          channels: channels,
        }),
      });

      setIsCreating(false);

      if (response.ok) {
        setModalIsOpen(false);
        fetchServerData();
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (error) {
      setIsCreating(false);
      setError("An error occurred while creating channels");
    }
  };

  const handleAddChannel = () => {
    if (!selectedCategory.id) {
        setError("Please select a category");
        return;
    }

    if (newChannel.id === selectedCategory.id && newChannel !== "") {
      const channelArray = newChannel.name
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name !== "");

      setChannels((prev) => ({
        ...prev,
        [selectedCategory.id]: {
          ...prev[selectedCategory.id],
          channels: [
            ...channelArray.map((name) => ({ name, type: 0 })),
            ...prev[selectedCategory.id].channels,
          ],
        },
      }));
    }
  };

  const handleDeleteChannel = (channel) => {
    setChannels((prev) => ({
      ...prev,
      [selectedCategory.id]: {
        ...prev[selectedCategory.id],
        channels: prev[selectedCategory.id].channels.filter(
          (c) => c.name !== channel.name
        ),
      },
    }));
  };

  return (
    <div>
      <button
        onClick={openModal}
        className="px-4 py-2 text-white rounded-lg transition bg-indigo-500 hover:bg-indigo-700 mr-2"
      >
        Create Channels
      </button>
      {modalIsOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="dark:bg-indigo-400 p-8 bg-white rounded-lg shadow-lg w-5/12">
            <DropdownMenuLabel>Category</DropdownMenuLabel>
            <div className="flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    {selectedCategory?.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="dark:bg-gray-800">
                  {serverCategories?.map((category) => (
                    <DropdownMenuItem
                      className="hover:dark:bg-gray-600 rounded-lg"
                      key={category.id}
                      onSelect={() => setSelectedCategory(category)}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="relative flex-1 ml-4">
                <Input
                  type="text"
                  placeholder="Channel Name"
                  value={newChannel[selectedCategory.id]?.name}
                  onChange={(e) =>
                    setNewChannel({
                      id: selectedCategory.id,
                      name: e.target.value,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddChannel();
                    }
                  }}
                  className="pr-10 text-gray-950"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-950"
                  onClick={handleAddChannel}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <hr className="my-4" />
            <div className="overflow-auto h-64">
              {Object.keys(channels)
                .filter((category) => channels[category].channels.length > 0)
                .map((category) => (
                  <div key={category} className="flex flex-col">
                    <h3 className="text-lg font-bold text-gray-950">
                      {channels[category].categoryName}
                    </h3>
                    <ul className="space-y-1">
                      {channels[category].channels.map((channel) => (
                        <li
                          key={channel.name}
                          className="flex items-center justify-between bg-muted rounded-md"
                        >
                          <span>{channel.name}</span>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteChannel(channel)}
                              className="text-muted-foreground text-gray-950 hover:text-foreground"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className={`px-4 py-2 text-white rounded-lg transition mr-2 mb-2 ${
                isCreating ? "bg-gray-400" : "bg-green-500 hover:bg-green-700"
              }`}
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => setModalIsOpen(false)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition"
            >
              Close
            </button>
            {error && <div className="text-red-500">{error}</div>}

            <Card>
              <CardContent>
                <p className="text-sm">
                  Please note : This will create role and channel on the
                  selected catagory, everyone will be hidden for those channes
                  and the created role will be assigned to the channel.
                </p>
                <br />
                <p>Please create catagory if you don&apos;t see any.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function PlusIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
