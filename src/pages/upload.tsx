import { useState, useRef } from "react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { getSession, GetSessionParams } from "next-auth/react";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { GetServerSidePropsContext } from "next";
import { filesize } from "filesize";
import { Upload, X, FileUp, Link as LinkIcon } from "lucide-react";
import { getBase } from "@lib";
import { toast } from "sonner";
import { random } from "@lib/generators";
import { Button, Select, Toggle } from "@components/ui";

const CHUNK_SIZE = 50 * 1024 * 1024;
const MAX_FILE_SIZE = 95 * 1024 * 1024;
const CHUNKED_ENABLED = process.env.CHUNKED_UPLOADS === 'true';

export default function UploadPage({ expireDate }: { expireDate: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragging, setDragging] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isKeepingOrig, setKeepOrig] = useState(false);
  const [expiration, setExpiration] = useState(expireDate || "never");
  const [urlInput, setUrlInput] = useState("");
  const [isUploadingUrl, setIsUploadingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const expirationOptions = [
    { value: "never", label: "Never" },
    { value: "1h", label: "1 Hour" },
    { value: "6h", label: "6 Hours" },
    { value: "1d", label: "1 Day" },
    { value: "1w", label: "1 Week" },
    { value: "30d", label: "1 Month" },
    { value: "90d", label: "3 Months" },
    { value: "1y", label: "1 Year" },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const clipboardItems = event.clipboardData?.items;
    if (clipboardItems) {
      const newFiles: File[] = [];
      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) newFiles.push(file);
        }
      }
      if (newFiles.length > 0) {
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      } else {
        toast.error("No valid files found in clipboard.");
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const newFiles = Array.from(event.dataTransfer.files);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const uploadSingleFile = (file: File, onProgress: (progress: number) => void) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("files", file);
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            onProgress(100);
            resolve(data);
          } catch {
            reject(new Error(`Upload failed: invalid response (${xhr.status})`));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.message || `Upload failed. Status: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed. Status: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed due to a network error."));

      xhr.open("POST", "/api/files");
      xhr.setRequestHeader("isPrivate", isPrivate.toString());
      xhr.setRequestHeader("keepOriginalName", isKeepingOrig.toString());
      xhr.setRequestHeader("expiresIn", expiration);
      xhr.send(formData);
    });
  };

  const safeParseError = async (response: Response): Promise<string> => {
    const text = await response.text().catch(() => "");
    try {
      const json = JSON.parse(text);
      return json.message || json.error || `Upload failed (${response.status})`;
    } catch {
      return text ? `Upload failed (${response.status}): ${text.substring(0, 200)}` : `Upload failed (${response.status})`;
    }
  };

  const uploadChunkedFile = async (file: File, onProgress: (progress: number) => void) => {
    const uploadId = random(25);
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-upload-id": uploadId,
          "x-chunk-index": chunkIndex.toString(),
          "x-original-filename": file.name,
        },
        body: chunk,
      });

      if (!response.ok) {
        throw new Error(`Chunk ${chunkIndex + 1}/${totalChunks} failed: ${await safeParseError(response)}`);
      }
      onProgress(Math.round(((chunkIndex + 1) / totalChunks) * 99));
    }

    const finalizeResponse = await fetch("/api/files", {
      method: "POST",
      headers: {
        "x-upload-id": uploadId,
        "x-finalize": "true",
        "x-total-chunks": totalChunks.toString(),
        "x-original-filename": file.name,
        isPrivate: isPrivate.toString(),
        keepOriginalName: isKeepingOrig.toString(),
        expiresIn: expiration,
      },
    });

    if (!finalizeResponse.ok) {
      throw new Error(await safeParseError(finalizeResponse));
    }

    onProgress(100);
    return await finalizeResponse.json();
  };

  const handleUpload = async () => {
    if (files.length === 0) return toast.error("Please select some files to upload.");

    setUploading(true);
    setUploadProgress({});

    const uploadPromises = files.map((file) => {
      const onProgress = (progress: number) => {
        setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
      };
      if (CHUNKED_ENABLED && file.size > MAX_FILE_SIZE) {
        return uploadChunkedFile(file, onProgress);
      } else {
        return uploadSingleFile(file, onProgress);
      }
    });

    const results = await Promise.allSettled(uploadPromises);

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.url) {
        toast.success(
          <Link href={result.value.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            {result.value.url}
          </Link>,
          { duration: Infinity }
        );
      } else {
        const file = files[index];
        const errorMessage = result.status === "rejected" ? result.reason?.message : "An unknown error occurred.";
        toast.error(`Failed to upload ${file.name}. ${errorMessage}`);
      }
    });

    setFiles([]);
    setUploading(false);
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return toast.error("Please enter a URL.");
    setIsUploadingUrl(true);
    try {
      const response = await fetch("/api/files/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput.trim(),
          isPrivate,
          keepOriginalName: isKeepingOrig,
          expiresIn: expiration,
        }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        toast.success(
          <Link href={data.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            {data.url}
          </Link>,
          { duration: Infinity }
        );
        setUrlInput("");
      } else {
        toast.error(data.message || data.error?.message || "Failed to upload from URL.");
      }
    } catch {
      toast.error("Failed to upload from URL.");
    } finally {
      setIsUploadingUrl(false);
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <NextSeo
        title="Rapid Host - Upload"
        description="Upload Files to Rapid Host"
      />
      <Header />

      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Upload files</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Drag & drop, paste from clipboard, or click to browse</p>
          </div>

          <div
            className={`
              relative cursor-pointer rounded-md border-2 border-dashed transition-all duration-200
              ${dragging
                ? "border-blue-500/50 bg-blue-500/5"
                : "border-[var(--border-default)] hover:border-[var(--border-accent)] bg-surface-elevated/50"
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className={`p-3 rounded-md mb-3 transition-colors ${dragging ? "bg-blue-500/10" : "bg-surface-hover"}`}>
                <FileUp className={`w-6 h-6 ${dragging ? "text-blue-400" : "text-[var(--text-muted)]"}`} />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {dragging ? "Drop files here" : "Click or drop files to upload"}
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => {
                const progress = uploadProgress[file.name] || 0;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-md bg-surface-elevated border border-[var(--border-subtle)]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] truncate">{file.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{filesize(file.size)}</p>
                      {uploading && (
                        <div className="mt-2 h-1 rounded-full bg-surface-hover overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {!uploading && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(index); }}
                        className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <input
              type="url"
              placeholder="Or paste a URL to upload from..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUrlUpload(); }}
              className="flex-1 px-3 py-2 text-sm rounded-md bg-surface-elevated border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
            <Button
              onClick={handleUrlUpload}
              loading={isUploadingUrl}
              disabled={!urlInput.trim()}
              size="sm"
              icon={<LinkIcon className="w-4 h-4" />}
            >
              Fetch
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <Toggle
                id="keepname-checkbox"
                checked={isKeepingOrig}
                onChange={(e) => setKeepOrig(e.target.checked)}
                label="Keep original name"
              />
              <Toggle
                id="private-checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                label="Private"
              />
            </div>

            <Select
              options={expirationOptions}
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
            />

            <Button
              onClick={handleUpload}
              loading={uploading}
              disabled={files.length === 0}
              icon={<Upload className="w-4 h-4" />}
              className="w-full"
              size="lg"
            >
              Upload {files.length > 0 ? `(${files.length})` : ""}
            </Button>

            <p className="text-xs text-[var(--text-muted)] text-center mt-2">
              Each file gets its own URL. View all uploads in your{" "}
              <Link href="/dashboard" className="text-blue-400 hover:underline">dashboard</Link>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export async function getServerSideProps(context: GetSessionParams & GetServerSidePropsContext) {
  const session = await getSession(context);
  if (!session || !session.user) {
    const callbackUrl = encodeURIComponent(context.resolvedUrl || "/upload");
    return { redirect: { destination: `/login?cbU=${callbackUrl}`, permanent: false } };
  }

  const baseUrl = getBase(context.req);
  let expireDate = "never";

  try {
    const userResponse = await fetch(`${baseUrl}/api/users/${session.user.username}`, {
      headers: { Authorization: session.user.token ?? "" },
    });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      if (userData.success && userData.user && userData.user.defaultFileExpiration) {
        expireDate = userData.user.defaultFileExpiration;
      }
    } else {
      console.warn(`Failed to fetch user shortener preference for ${session.user.username}, status: ${userResponse.status}`);
    }
  } catch (error) {
    console.error("Error fetching user shortener preference in getServerSideProps:", error);
  }
  return { props: { expireDate } };
}
