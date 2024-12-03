/* eslint-disable @typescript-eslint/no-explicit-any */
// This entire page should be rewritten and reworked.
import { getBase } from "@lib";
import { GetServerSidePropsContext } from "next";
import { getSession, GetSessionParams } from "next-auth/react";
import { useRouter } from "next/router";

const extensions = [
  "html",
  "css",
  "ejs",
  "md",
  "js",
  "py",
  "ts",
  "Lua",
  "cpp",
  "c",
  "bat",
  "h",
  "pl",
  "java",
  "sh",
  "swift",
  "vb",
  "cs",
  "haml",
  "yml",
  "markdown",
  "hs",
  "pl",
  "ex",
  "yaml",
  "jsx",
  "tsx",
  "txt",
];

export default function FilePage({
  file,
  isAuthenticated,
  isOwner,
  fileUrl,
  contentHtml,
}: {
  file: any;
  isAuthenticated: boolean;
  isOwner: boolean;
  fileUrl: string;
  contentHtml: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    // Implement file deletion if the user is the owner or admin
    if (isOwner) {
      try {
        await fetch(`/api/file/${file.id}`, { method: "DELETE" });
        router.push("/dashboard"); // Redirect after deletion
      } catch (_error) {
        alert("Failed to delete the file");
      }
    }
  };

  const renderFileContent = () => {
    const extension = file.extension.toLowerCase();
    if (["js", "ts", "md", "txt"].includes(extension)) {
      // If it's a text-based document (JS, TS, MD, TXT)
      if (extension === "md") {
        return <div dangerouslySetInnerHTML={{ __html: contentHtml }} />;
      } else {
        return <pre className="bg-gray-800 p-4 text-white">{contentHtml}</pre>;
      }
    } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      // If it's an image
      return <img src={fileUrl} alt={file.name} className="max-w-full" />;
    } else if (["mp4", "mkv", "webm"].includes(extension)) {
      // If it's a video
      return (
        <video controls className="max-w-full">
          <source src={file.url} type={`video/${extension}`} />
          Your browser does not support the video tag.
        </video>
      );
    } else if (["mp3", "wav", "ogg"].includes(extension)) {
      // If it's audio
      return (
        <audio controls>
          <source src={file.url} type={`audio/${extension}`} />
          Your browser does not support the audio element.
        </audio>
      );
    } else {
      // For any other file, just show raw content
      return <pre className="bg-gray-800 p-4 text-white">{contentHtml}</pre>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-white bg-black">
      <main className="flex-grow px-4 py-8">
        <h1 className="text-3xl font-bold">{file.name}</h1>
        <div className="mt-4">{renderFileContent()}</div>

        {isAuthenticated && isOwner && (
          <div className="mt-4 flex space-x-4">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Delete
            </button>
            <a
              href={file.url}
              download={fileUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Download
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

export async function getServerSideProps({
  params,
  req,
  res,
  resolvedUrl,
  query,
}: GetSessionParams & GetServerSidePropsContext) {
  const session = await getSession({ req });
  const id = params?.id;
  const baseUrl = getBase(req);

  if (!id) return { notFound: true };
  // Check if it is a shortened url.
  const targetReq = await fetch(`${baseUrl}/api/url/${id}`);
  if (targetReq.ok) {
    const target = await targetReq.json();

    if (target) {
      return {
        redirect: {
          destination: target.link.url,
          permanent: false, // Use a 302 redirect
        },
      };
    }
  }

  const fileRequest = await fetch(`${baseUrl}/api/files/${id}`, {
    headers: {
      // Incase the file is marked as private and needs extra credentials.
      Authorization: session?.user.token,
      getInfo: true,
    },
  });
  if (!fileRequest.ok) return { notFound: true };

  const file = await fileRequest.json();
  if (!file) return { notFound: true };

  const fileUrl = `${baseUrl}/api/files/${file.id}`;
  const isAuthenticated = Boolean(session);
  const isOwner = isAuthenticated && session?.user.username === file.owner;
  const fileContent = await fetch(fileUrl, {
    headers: {
      Authorization: session?.user.token,
    },
  });
  const arrayBuffer = await fileContent.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  let contentHtml;
  const { raw, r, download, d } = query;

  if (raw || r || download || d) {
    res.end(buffer);

    return { props: {} };
  }

  // if (extensions.includes(file.extension)) {
  //   const processedContent = await remark()
  //     .use(html)
  //     .process(buffer.toString());
  //   contentHtml = processedContent.toString();
  // }

  if (file.isPrivate && !session) {
    const callbackUrl = encodeURIComponent(resolvedUrl || "/");
    return {
      redirect: {
        destination: `/login?cbU=${callbackUrl}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      file,
      isAuthenticated,
      isOwner,
      fileUrl,
      contentHtml,
    },
  };
}
