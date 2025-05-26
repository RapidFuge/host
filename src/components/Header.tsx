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
    // Show a confirmation dialog before logging out
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      signOut({ callbackUrl: `${window.location.origin}/` });
    }
  };

  return (
    <header className="sticky top-0 w-full clearNav z-50">
      <div className="max-w-5xl mx-auto flex flex-wrap p-5 flex-col md:flex-row">
        <div className="flex flex-row items-center justify-between p-3 md:p-1">
          <Link
            href="/"
            className="flex text-3xl text-white font-black mb-4 md:mb-0"
          >
            RAPID HOST
          </Link>
          <button
            className="text-white pb-4 cursor-pointer leading-none px-3 py-1 md:hidden outline-none focus:outline-none content-end ml-auto min-w-[24px] min-h-[24px]"
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
        <div
          className={
            "md:flex flex-grow items-center" +
            (navbarOpen ? " flex" : " hidden")
          }
        >
          <div className="md:ml-auto md:mr-auto font-4 pt-1 md:pl-14 pl-1 flex flex-wrap items-center md:text-base text-1xl md:justify-center justify-items-start">
            <Link
              href="/upload"
              className="mr-11 pr-2 cursor-pointer text-gray-300 hover:text-white font-semibold tr04"
            >
              Upload
            </Link>

            <Link
              href="/shorten"
              className="mr-12 md:ml-11 ml-0 cursor-pointer text-gray-300 hover:text-white font-semibold tr04"
            >
              Shorten
            </Link>
          </div>
          <Link
            href={session ? "/dashboard" : "/login"}
            className="p-1 pt-1.5 px-2 text-gray-300 text-center min-w-[24px] min-h-[24px] hover:text-white border-gray-300 tr04"
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
              className="p-1 pt-1.5 px-2 text-gray-300 text-center min-w-[24px] min-h-[24px] hover:text-red-500 border-gray-300 tr04"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="text-2xl" />
            </button>
          )}
          <Link
            href="https://git.fuge.dev/rapid/host"
            rel="noopener noreferrer"
            target="_blank"
            className="pl-7 min-w-[24px] min-h-[24px] text-gray-300 hover:text-white tr04"
          >
            <FontAwesomeIcon
              icon={faGitAlt}
              className="text-2xl"
            ></FontAwesomeIcon>
          </Link>
        </div>
      </div>
    </header>
  );
}
