// components/dashboard/settings/CreateUserForm.tsx
import { useState } from "react";

interface CreateUserFormProps {
  token: string;
}

export default function CreateUserForm({ token }: CreateUserFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw data.error || data.message || "Failed to create user.";
      }
      setMessage({
        type: "success",
        text: `User "${data.username}" created successfully!`,
      });
      setUsername("");
      setPassword("");
    } catch (err: any) {
      console.log(err, 1);
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors"
      >
        Create New User
      </button>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-neutral-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            {" "}
            {/* neutral */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                Create New User
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ×
              </button>{" "}
              {/* neutral */}
            </div>
            <form onSubmit={handleSubmit}>
              {message && (
                <div
                  className={`p-3 mb-4 rounded text-sm ${
                    message.type === "success"
                      ? "bg-green-700 text-green-100"
                      : "bg-red-700 text-red-100"
                  }`}
                >
                  {message.text}
                </div>
              )}
              <div className="mb-4">
                <label
                  htmlFor="new-username"
                  className="block text-sm font-medium text-zinc-300 mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="new-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Alphanumeric, 3-50 chars"
                />{" "}
                {/* neutral */}
              </div>
              <div className="mb-6">
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-zinc-300 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Min 3 chars"
                />{" "}
                {/* neutral */}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm bg-neutral-600 hover:bg-neutral-500 rounded text-white"
                  disabled={isLoading}
                >
                  Cancel
                </button>{" "}
                {/* neutral */}
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white disabled:bg-neutral-500"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create User"}
                </button>{" "}
                {/* neutral for disabled */}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
