import React from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faRightToBracket,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faGitAlt } from "@fortawesome/free-brands-svg-icons";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const [navbarOpen, setNavbarOpen] = React.useState(false);
  const { data: session } = useSession();

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      signOut({ callbackUrl: `${window.location.origin}/` });
    }
  };
  const mobileMenuStackedItemClasses = "flex flex-col items-center mt-4 w-full";

  return (
    <header className="sticky top-0 w-full clearNav z-50 bg-black">
      <div className="max-w-5xl mx-auto flex flex-wrap p-5 flex-col md:flex-row md:items-center md:relative">
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="flex text-3xl text-white font-black">
            RAPID HOST
          </Link>
          <button
            className="text-white cursor-pointer leading-none px-3 py-1 md:hidden outline-none focus:outline-none content-end min-w-[24px] min-h-[24px]"
            type="button"
            aria-label="button"
            onClick={() => setNavbarOpen(!navbarOpen)}
          >
            <FontAwesomeIcon
              icon={!navbarOpen ? faBars : faTimes}
              className={`text-2xl transition-transform duration-300 ease-in-out transform ${
                navbarOpen ? "rotate-90" : "rotate-0"
              }`}
            ></FontAwesomeIcon>
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
              className="cursor-pointer text-gray-300 hover:text-white font-semibold tr04"
            >
              Upload
            </Link>
            <Link
              href="/shorten"
              className="cursor-pointer text-gray-300 hover:text-white font-semibold tr04"
            >
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
              <FontAwesomeIcon
                icon={session ? faUser : faRightToBracket}
                className="text-2xl"
              ></FontAwesomeIcon>
            </Link>
            {session && (
              <button
                onClick={handleLogout}
                type="button"
                aria-label="button"
                className="p-1 px-2 text-gray-300 text-center min-w-[24px] min-h-[24px] hover:text-red-500 tr04"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="text-2xl" />
              </button>
            )}
            <Link
              href="https://git.fuge.dev/rapid/host"
              rel="noopener noreferrer"
              target="_blank"
              className="p-1 px-2 text-gray-300 min-w-[24px] min-h-[24px] hover:text-white tr04" // Consistent padding
            >
              <FontAwesomeIcon
                icon={faGitAlt}
                className="text-2xl"
              ></FontAwesomeIcon>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
