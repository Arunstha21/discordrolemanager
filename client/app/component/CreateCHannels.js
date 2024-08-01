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
const apiLink = "http://localhost:3001";

export default function CreateChannel({ server }) {
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

  const fetchServerData = async () => {
    try {
      const response = await fetch(`${apiLink}/api/serverData/${server.id}`, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        setServerRoles(data.roles);
        setServerCategories(data.categories);
        const newChannels = data.categories.reduce((acc, category) => {
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
        console.log(newChannels);
      } else {
        setError("Failed to fetch data: ", response.statusText);
      }
    } catch (error) {
      setError("An error occurred while fetching data: ", error);
    }
  };

  function openModal() {
    setModalIsOpen(true);
    fetchServerData();
  }

  const handleSubmit = async () => {};

  const handleAddChannel = () => {
    if (
      newChannel.id === selectedCategory.id &&
      newChannel.name.trim() !== ""
    ) {
      setChannels((prev) => ({
        ...prev,
        [selectedCategory.id]: {
          ...prev[selectedCategory.id],
          channels: [
            { name: newChannel.name, type: 0, role: [] },
            ...prev[selectedCategory.id].channels,
          ],
        },
      }));
    }
  };

  const handleAddRole = (channel, role) => {
    setChannels((prev) => ({
      ...prev,
      [selectedCategory.id]: {
        ...prev[selectedCategory.id],
        channels: prev[selectedCategory.id].channels.map((c) => {
          if (c.name === channel.name) {
            return {
              ...c,
              role: [
                ...c.role,
                { role: role.name, id: role.id, color: role.color },
              ],
            };
          }
          return c;
        }),
      },
    }));
  };
  const handleDeleteRole = (channel, role) => {
    setChannels((prev) => ({
      ...prev,
      [selectedCategory.id]: {
        ...prev[selectedCategory.id],
        channels: prev[selectedCategory.id].channels.map((c) => {
          if (c.name === channel.name) {
            return {
              ...c,
              role: c.role.filter((r) => r.id !== role.id),
            };
          }
          return c;
        }),
      },
    }));
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
            <div className="space-y-4">
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
                          <div className="flex">
                            <div className="w-40 overflow-x-auto flex flex-nowrap items-center p-1 space-x-2">
                              {channel.role.map((role) => (
                                <div
                                  key={role.id}
                                  className="flex items-center space-x-1"
                                >
                                  <div
                                    className="inline-block py-1 px-2 text-xs rounded-full"
                                    style={{ backgroundColor: role.color }}
                                  >
                                    {role.role}
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleDeleteRole(channel, role)
                                    }
                                    className="text-gray-950 hover:text-red-500"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center space-x-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="dark:bg-gray-800">
                                  {serverRoles.map((role) => (
                                    <DropdownMenuItem
                                      key={role.id}
                                      className="hover:dark:bg-gray-600 rounded-lg"
                                      onSelect={() =>
                                        handleAddRole(channel, role)
                                      }
                                    >
                                      {role.name}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteChannel(channel)}
                                className="text-muted-foreground text-gray-950 hover:text-foreground"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
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
