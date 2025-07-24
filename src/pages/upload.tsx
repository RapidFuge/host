import { useState, useRef } from "react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { getSession, GetSessionParams } from "next-auth/react";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { GetServerSidePropsContext } from "next";
import { filesize } from "filesize";
import { LoaderCircle, Upload } from "lucide-react";
import { getBase } from "@lib";
import { toast } from "sonner";
import { random } from "@lib/generators";

const CHUNK_SIZE = 50 * 1024 * 1024;
const MAX_FILE_SIZE = 95 * 1024 * 1024;

export default function UploadPage({ expireDate }: { expireDate: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragging, setDragging] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isKeepingOrig, setKeepOrig] = useState(false);
  const [expiration, setExpiration] = useState(expireDate || "never");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const expirationOptions = [
    { value: "never", label: "Expires in: Never" },
    { value: "1h", label: "Expires in: 1 Hour" },
    { value: "6h", label: "Expires in: 6 Hours" },
    { value: "1d", label: "Expires in: 1 Day" },
    { value: "1w", label: "Expires in: 1 Week" },
    { value: "30d", label: "Expires in: 1 Month" },
    { value: "90d", label: "Expires in: 3 Months" },
    { value: "1y", label: "Expires in: 1 Year" },
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
          const data = JSON.parse(xhr.responseText);
          onProgress(100);
          resolve(data);
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.message || `Upload failed. Status: ${xhr.status}`));
          } catch (_) {
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
        const errorText = await response.text();
        throw new Error(`Chunk ${chunkIndex + 1}/${totalChunks} upload failed: ${errorText}`);
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
      const errorData = await finalizeResponse.json();
      throw new Error(errorData.message || "Failed to finalize upload.");
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
      if (file.size > MAX_FILE_SIZE) {
        return uploadChunkedFile(file, onProgress);
      } else {
        return uploadSingleFile(file, onProgress);
      }
    });

    const results = await Promise.allSettled(uploadPromises);

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.url) {
        toast.success(
          <Link href={result.value.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
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

  const renderFileList = () => {
    if (files.length === 0) return null;

    return (
      <ul className="list-none mt-4 text-left w-96">
        {files.map((file, index) => {
          const progress = uploadProgress[file.name] || 0;
          return (
            <li
              key={index}
              className="text-sm text-gray-400 mb-2"
            >
              <div className="flex justify-between items-center">
                <span className="truncate pr-2">
                  {file.name} - {filesize(file.size)}
                </span>
                {!uploading && (
                  <button
                    className="ml-4 text-red-500 hover:text-red-700 flex-shrink-0"
                    onClick={() => handleRemoveFile(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
              {uploading && (
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-black"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <NextSeo
        title="RAPID HOST - Upload"
        description="Upload Files to Rapid Host"
      />

      <Header />

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold mb-4 text-white ">File Uploader</h1>
        <div
          className="relative w-96 h-48 border-4 border-dashed border-neutral-400 p-4 cursor-pointer mb-4"
          onClick={() => fileInputRef.current?.click()}
        >
          <div
            className={`absolute inset-0 bg-transparent flex items-center justify-center ${dragging ? "text-blue-500" : "text-gray-500"
              }`}
          >
            {dragging ? (
              <p className="text-xl">Drop files here</p>
            ) : (
              <p className="text-lg">
                Drag and drop files, paste from clipboard, or click to select
              </p>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
        </div>

        {renderFileList()}

        <div className="flex items-center space-x-2 mt-2">
          <input
            type="checkbox"
            id="keepname-checkbox"
            checked={isKeepingOrig}
            onChange={(e) => setKeepOrig(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="keepname-checkbox" className="text-sm text-gray-300">
            Keep the original name of the file(s)
          </label>
        </div>

        <div className="flex items-center space-x-2 mb-2">
          <input
            type="checkbox"
            id="private-checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="private-checkbox" className="text-sm text-gray-300">
            Make files private
          </label>
        </div>

        <div className="flex items-center space-x-5 mb-4">
          <select
            id="shortenerType"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-700 bg-black rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {expirationOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-auto px-6 py-2 tr04 ${uploading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
            } text-white font-semibold rounded focus:outline-none flex items-center justify-center`}
        >
          {uploading ? (
            <span className="flex items-center">
              <LoaderCircle className="animate-spin mr-2 w-5 h-5 text-white" />
              Uploading
            </span>
          ) : (
            <span className="flex items-center">
              <Upload className="mr-2 w-5 h-5 text-white" />
              Upload Files
            </span>
          )}
        </button>
        <p className="mt-4 text-neutral-500">
          While the uploader can support multiple file uploads, the result will
          only give one URL. To see other files, visit your{" "}
          <Link href="/dashboard" className="text-blue-500 hover:underline">
            dashboard
          </Link>
          .
        </p>
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