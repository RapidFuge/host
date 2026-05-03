import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button, Input } from "@components/ui";
import { UserRoundPlus } from "lucide-react";

export default function CreateUserForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsModalOpen(false);
    };
    if (isModalOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw data.error;
      toast.success(`User "${data.username}" created!`);
      setUsername("");
      setPassword("");
      setIsModalOpen(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || err || "Error creating user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => { setUsername(""); setPassword(""); setIsModalOpen(true); }}
        icon={<UserRoundPlus className="w-4 h-4" />}
      >
        Create user
      </Button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }} />
          <div className="relative w-full max-w-sm glass-strong rounded-md border border-[var(--border-default)] shadow-2xl">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Create New User</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl p-1 transition-colors">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Alphanumeric, 3-50 chars"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min 3 chars"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} disabled={isLoading}>Cancel</Button>
                <Button type="submit" size="sm" loading={isLoading}>Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
