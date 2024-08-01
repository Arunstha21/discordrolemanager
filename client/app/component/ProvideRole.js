const { useState, useEffect } = require("react");
const apiLink = "http://localhost:3001";

export default function ProvideRole({ server, serverData, fetchServerData }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("Select Role");
  const [serverRoles, setServerRoles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const clearError = () => {
    setInterval(() => {
      setError(null);
    }, 5000);
  };

  useEffect(() => {
    fetchServerData();
  }, []);

  useEffect(() => {
    setServerRoles(serverData?.roles);
  }, [serverData]);

  useEffect(() => {
    clearError();
  }, [error]);

  const handleSubmit = async () => {
    if (!userId) {
      setError("User Id is required");
      return;
    }
    if (!role) {
      setError("Role is required");
      return;
    }
    const data = {
      guildId: server.id,
      userId,
      roleId: role,
    };

    setIsCreating(true);
    try {
      const response = await fetch(`${apiLink}/api/provideRole`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      setIsCreating(false);

      if (response.ok) {
        setSuccess("Role provided successfully");
        setModalIsOpen(false);
      } else {
        console.error("Failed to provide Role: ", response.statusText);
      }
    } catch (error) {
      console.error("Failed to provide Role: ", error);
      setIsCreating(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setModalIsOpen(true)}
        className="bg-indigo-500 hover:bg-indigo-700 text-white rounded-md px-4 py-2"
      >
        Provide Role
      </button>
      {modalIsOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="dark:bg-indigo-400 p-8 bg-white rounded-lg shadow-lg w-96">
            <label className="block text-sm font-medium text-gray-700">
              User Id
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 mb-4 text-sm dark:text-gray-950 border rounded-lg"
            />
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select onChange={(e)=> setRole(e.target.value)} className="w-full px-3 py-2 mb-4 text-sm dark:text-gray-950 border rounded-lg">
                <option value="" selected>Select Role</option>
                {serverRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                    {role.name}
                    </option>
                ))}
            </select>

            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className={`px-4 py-2 text-white rounded-lg transition mr-2 mb-2 ${
                isCreating ? "bg-gray-400" : "bg-green-500 hover:bg-green-700"
              }`}
            >
              {isCreating ? "Providing..." : "Provide Role"}
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
