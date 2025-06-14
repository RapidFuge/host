import { useState, useRef } from "react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { getSession, GetSessionParams } from "next-auth/react";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { GetServerSidePropsContext } from "next";
import { filesize } from "filesize";
import { LoaderCircle, Upload } from "lucide-react";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false); // State for the checkbox
  const [isKeepingOrig, setKeepOrig] = useState(false); // State for the checkbox
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        setError("No valid files found in clipboard.");
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

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select some files to upload.");
      return;
    }

    setUploading(true);
    try {
      // Create FormData and append files under the "files" key
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      // Send the request to the local Next.js API route
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          isPrivate: isPrivate.toString(),
          keepOriginalName: isKeepingOrig.toString()
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadResult(data.url); // Assuming the URL is returned in the response
        setFiles([]); // Clear files after successful upload
        setError(null);
      } else {
        throw new Error("Failed to upload files.");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setError(`Failed to upload files. ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const renderFileList = () => {
    if (files.length === 0) return <p></p>;

    return (
      <ul className="list-disc mt-4 text-left">
        {files.map((file, index) => (
          <li
            key={index}
            className="text-sm text-gray-500 flex justify-between items-center"
          >
            <span>
              {file.name} - {filesize(file.size)}
            </span>
            <button
              className="ml-4 text-red-500 hover:text-red-700"
              onClick={() => handleRemoveFile(index)}
            >
              Remove
            </button>
          </li>
        ))}
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
        {error && <p className="mt-4 text-red-500 mb-4">{error}</p>}
        {uploadResult && (
          <div className="mt-4 mb-4 p-2 bg-green-100 border-l-4 border-green-500 text-green-900">
            <Link
              href={uploadResult}
              className="text-blue-500 hover:underline bg-green-100 rounded"
            >
              {uploadResult}
            </Link>
          </div>
        )}
        <div
          className="relative w-96 h-48 border-4 border-dashed border-gray-400 p-4 cursor-pointer mb-4"
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

        <div className="flex items-center space-x-2 my-2">
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

        <div className="flex items-center space-x-2 mb-2">
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
        <p className="mt-4 text-gray-500">
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

export async function getServerSideProps(
  context: GetSessionParams & GetServerSidePropsContext
) {
  const session = await getSession(context);

  if (!session) {
    const callbackUrl = encodeURIComponent(context.resolvedUrl || "/");
    return {
      redirect: {
        destination: `/login?cbU=${callbackUrl}`,
        permanent: false,
      },
    };
  }

  return {
    props: { user: session.user },
  };
}
