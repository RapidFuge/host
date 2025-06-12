// components/dashboard/settings/CreateUser.tsx
import { LoaderCircle, UserRoundPlus } from "lucide-react";
import { useState, useEffect } from "react"; // Added useEffect for ESC key

export default function CreateUserForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setMessage(null); // Clear previous messages
    setUsername(""); // Reset form fields
    setPassword("");
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    if (isModalOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Admin auth handled by API via session/cookie
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to create user.");
      }
      setMessage({
        type: "success",
        text: `User "${data.username}" created successfully!`,
      });
      setUsername(""); // Clear form on success
      setPassword("");
      // router.reload(); // Consider if reload is best UX or just update a user list if displayed elsewhere
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="flex bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition-colors"
      >
        <UserRoundPlus className="mr-2 w-5 h-5" strokeWidth={2.5} />
        Create New User
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-neutral-800 border border-neutral-800 p-6 rounded-md shadow-xl w-full max-w-md flex flex-col text-zinc-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                Create New User
              </h3>
              <button
                onClick={closeModal}
                className="text-neutral-400 hover:text-white text-2xl leading-none p-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div
                  className={`p-3 rounded text-sm ${message.type === "success"
                    ? "bg-green-700 text-green-100"
                    : "bg-red-700 text-red-100"
                    }`}
                >
                  {message.text}
                </div>
              )}
              <div>
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
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Alphanumeric, 3-50 chars"
                />
              </div>
              <div>
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
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Min 3 chars"
                />
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 rounded text-white"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white disabled:bg-neutral-700 disabled:text-neutral-400"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <LoaderCircle className="animate-spin mr-2 w-5 h-5" />
                      Creating
                    </span>
                  ) : ("Create User")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
