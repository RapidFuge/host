import React from "react";
import Link from "next/link";
import { AlignJustify, X, LogIn, LogOut, User, Upload, Link as LinkIcon } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const [navbarOpen, setNavbarOpen] = React.useState(false);
  const { data: session } = useSession();

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      signOut();
    }
  };
  const mobileMenuStackedItemClasses = "flex flex-col items-center mt-4 w-full";

  return (
    <header className="sticky backdrop-blur-sm top-3 text-white w-[calc(100%-1rem)] xl:max-w-5xl mx-auto z-10 bg-black border border-neutral-900 rounded-xl shadow-lg">
      <div className="mx-auto flex flex-wrap p-5 flex-col md:flex-row md:items-center md:relative">
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="flex text-3xl text-white font-black">
            RAPID HOST
          </Link>
          <button
            className="text-white cursor-pointer leading-none px-3 py-1 outline-none focus:outline-none relative md:hidden"
            onClick={() => setNavbarOpen(!navbarOpen)}
          >
            <div className="relative w-6 h-6">
              <AlignJustify
                className={`absolute inset-0 text-2xl transition-all duration-300 ease-in-out ${navbarOpen
                  ? 'opacity-0 rotate-180'
                  : 'opacity-100 rotate-0'
                  }`}
              />
              <X
                className={`absolute inset-0 text-2xl transition-all duration-300 ease-in-out ${navbarOpen
                  ? 'opacity-100 rotate-0'
                  : 'opacity-0 rotate-180'
                  }`}
              />
            </div>
          </button>
        </div>

        <nav
          className={`
            ${navbarOpen ? mobileMenuStackedItemClasses : "hidden"} 
            md:flex md:items-center md:justify-center 
            md:absolute md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 
            md:mt-0 md:w-auto
          `}
        >
          <div className="flex flex-col items-center md:flex-row md:space-x-8 space-y-4 md:space-y-0 text-base">
            <Link
              href="/upload"
              className="cursor-pointer text-gray-300 hover:text-white font-semibold tr04 flex items-center justify-center"
            >
              <Upload className="mr-2 w-4 h-4" strokeWidth={2.5} />{" "}
              Upload
            </Link>
            <Link
              href="/shorten"
              className="cursor-pointer text-gray-300 hover:text-white font-semibold tr04 flex items-center justify-center"
            >
              <LinkIcon className="mr-2 w-4 h-4" strokeWidth={2.5} />{" "}
              Shorten
            </Link>
          </div>
        </nav>

        <div
          className={`
            ${navbarOpen ? mobileMenuStackedItemClasses : "hidden"}
            md:flex md:items-center md:w-auto md:mt-0 md:ml-auto 
          `}
        >
          <div className="flex items-center space-x-1 md:space-x-2">
            <Link
              href={session ? "/dashboard" : "/login"}
              className="p-1 px-2 text-gray-300 text-center min-w-[24px] min-h-[24px] hover:text-white tr04"
            >
              {(session ? (
                <User className="text-2xl" />
              ) : (
                <LogIn className="text-2xl" />
              ))}
            </Link>
            {session && (
              <button
                onClick={handleLogout}
                type="button"
                aria-label="button"
                className="p-1 px-2 text-gray-300 text-center min-w-[24px] min-h-[24px] hover:text-red-500 tr04"
              >
                <LogOut className="text-2xl" />
              </button>
            )}
            <Link
              href="https://github.com/rapidfuge/host"
              rel="noopener noreferrer"
              target="_blank"
              className="p-1 px-2 text-gray-300 min-w-[24px] min-h-[24px] hover:text-white tr04" // Consistent padding
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-2xl" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
              {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-2xl" aria-hidden="true"><path d="M23.546 10.93L13.067.452c-.604-.603-1.582-.603-2.188 0L8.708 2.627l2.76 2.76c.645-.215 1.379-.07 1.889.441.516.515.658 1.258.438 1.9l2.658 2.66c.645-.223 1.387-.078 1.9.435.721.72.721 1.884 0 2.604-.719.719-1.881.719-2.6 0-.539-.541-.674-1.337-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348.713.721.713 1.883 0 2.6-.719.721-1.889.721-2.609 0-.719-.719-.719-1.879 0-2.598.182-.18.387-.316.605-.406V8.835c-.217-.091-.424-.222-.6-.401-.545-.545-.676-1.342-.396-2.009L7.636 3.7.45 10.881c-.6.605-.6 1.584 0 2.189l10.48 10.477c.604.604 1.582.604 2.186 0l10.43-10.43c.605-.603.605-1.582 0-2.187" /></svg> */}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}