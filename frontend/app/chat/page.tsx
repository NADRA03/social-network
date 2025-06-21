'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import '../output.css';


export default function ChatPage() {
    const [showPopover, setShowPopover] = useState(false);
      const [open, setOpen] = useState(false);

    

  return (
    <main className="min-h-screen">




<div className="navbar bg-base-100 border-b border-base-300">
  <div className="flex-1">
    <a className="btn btn-ghost text-xl ml-2">Social Network</a>
  </div>
  <div className="flex gap-2">
<label className="input">
  <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <g
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeWidth="2.5"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </g>
  </svg>
  <input type="search" required placeholder="Search" />
</label>
    <div className="dropdown dropdown-end">
      <div id="nav-image" tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
        <div className="w-10 rounded-full">
          <img
            alt="Tailwind CSS Navbar component"
            src="https://img.daisyui.com/images/profile/demo/gordon@192.webp" />
        </div>
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
        <li>
          <a className="justify-between">
            Home
          </a>
        </li>
        <li><a>Dashboard</a></li>
        <li><a>Profile</a></li>
        <li><a>Settings</a></li>
        <li><a>Logout</a></li>
      </ul>
    </div>


      <div className="dropdown dropdown-end">
    <button tabIndex={0} className="btn btn-ghost btn-circle">
      <div className="indicator">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <span className="badge badge-xs badge-primary indicator-item"></span>
      </div>
    </button>
    <ul
      tabIndex={0}
      className="menu menu-sm dropdown-content bg-base-100 rounded-box mt-3 w-48 p-2 shadow"
    >
      <li><a>Notifications</a></li>
      <li><a>Mark all as read</a></li>
    </ul>
  </div>
  </div>
</div>

{/* nav end */}




<div className="flex">
<div className="bg-base-300 w-1/5 min-h-screen flex flex-col pl-10 pt-5">





<div className=''>
<div className="avatar avatar-online">
  <div className="w-24 rounded-full">
    <img src="https://img.daisyui.com/images/profile/demo/gordon@192.webp" />
  </div>
</div>
</div>



</div>
<div className="divider divider-horizontal"></div>


<div className="min-h-screen w-1/3 relative">
<div className="chat chat-start mt-2">
  <div className="chat-image avatar">
    <div className="w-10 rounded-full">
      <img
        onClick={() => setShowPopover(!showPopover)}
        alt="Tailwind CSS chat bubble component"
        src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
      />
    </div>
  </div>
  <div className="chat-header">
    Obi-Wan Kenobi
    <time className="text-xs opacity-50">12:45</time>
  </div>
  <div className="chat-bubble">You were the Chosen One!</div>
  <div className="chat-footer opacity-50">Delivered</div>






      <div className="relative inline-block text-left">

      {showPopover && (
        <div className="absolute z-10 mt-2 w-64 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg shadow-md dark:text-gray-400 dark:bg-gray-800 dark:border-gray-600">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <a href="#">
                <img
                  className="w-10 h-10 rounded-full"
                  src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                  alt="Jese Leos"
                />
              </a>
              <div>
                <button
                  type="button"
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs px-3 py-1.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                >
                  Follow
                </button>
              </div>
            </div>
            <p className="text-base font-semibold leading-none text-gray-900 dark:text-white">
              <a href="#">Jese Leos</a>
            </p>
            <p className="mb-3 text-sm font-normal">
              <a href="#" className="hover:underline">
                @jeseleos
              </a>
            </p>
            <p className="mb-4 text-sm">
              Open-source contributor. Building{" "}
              <a
                href="#"
                className="text-blue-600 dark:text-blue-500 hover:underline"
              >
                flowbite.com
              </a>
              .
            </p>
            <ul className="flex text-sm gap-4">
              <li>
                <a href="#" className="hover:underline">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    799
                  </span>{" "}
                  Following
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    3,758
                  </span>{" "}
                  Followers
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
</div>
<div className="chat chat-end">
  <div className="chat-image avatar">
    <div className="w-10 rounded-full">
      <img
        alt="Tailwind CSS chat bubble component"
        src="https://img.daisyui.com/images/profile/demo/anakeen@192.webp"
      />
    </div>
  </div>
  <div className="chat-header">
    Anakin
    <time className="text-xs opacity-50">12:46</time>
  </div>
  <div className="chat-bubble">I hate you!</div>
  <div className="chat-footer opacity-50">Seen at 12:46</div>
</div>






    <div className='absolute bottom-2 left-1/2 -translate-x-1/2 w-5/6'>
    <form>
      <label htmlFor="chat" className="sr-only">
        Your message
      </label>
      <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">
        {/* Upload Image Button */}
        <button
          type="button"
          className="inline-flex justify-center p-2 text-gray-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600"
        >
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 18"
          >
            <path
              fill="currentColor"
              d="M13 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM7.565 7.423 4.5 14h11.518l-2.516-3.71L11 13 7.565 7.423Z"
            />
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M18 1H2a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z"
            />
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM7.565 7.423 4.5 14h11.518l-2.516-3.71L11 13 7.565 7.423Z"
            />
          </svg>
          <span className="sr-only">Upload image</span>
        </button>

        {/* Add Emoji Button */}
        <button
          type="button"
          className="p-2 text-gray-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600"
        >
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13.408 7.5h.01m-6.876 0h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM4.6 11a5.5 5.5 0 0 0 10.81 0H4.6Z"
            />
          </svg>
          <span className="sr-only">Add emoji</span>
        </button>

        {/* Message Textarea */}
        <textarea
          id="chat"
          rows={1}
          className="block mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Your message..."
        ></textarea>

        {/* Send Button */}
        <button
          type="submit"
          className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600"
        >
          <svg
            className="w-5 h-5 rotate-90 rtl:-rotate-90"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 18 20"
          >
            <path d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z" />
          </svg>
          <span className="sr-only">Send message</span>
        </button>
      </div>
    </form>
    </div>


    
</div>

  <div className="divider divider-horizontal"></div>
  <div className="bg-base-300 w-3/7 min-h-screen">


    <div className="relative z-10 inline-block text-sm text-gray-500 dark:text-gray-400 w-full">
      <div className="p-3">
        <div className="flex">
          <div className="me-3 shrink-0">
            <a href="#" className="block p-2 bg-gray-100 rounded-lg dark:bg-gray-700">
              <img
                className="w-8 h-8 rounded-full"
                src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                alt="Flowbite logo"
              />
            </a>
          </div>
          <div>
            <p className="mb-1 text-base font-semibold leading-none text-gray-900 dark:text-white">
              <a href="#" className="hover:underline">Flowbite</a>
            </p>
            <p className="mb-3 text-sm font-normal">Tech company</p>
            <p className="mb-4 text-sm">
              Open-source library of Tailwind CSS components and Figma design system.
            </p>

            <div className="flex mb-3 -space-x-3 rtl:space-x-reverse">
              <img
                className="w-10 h-10 border-2 border-white rounded-full dark:border-gray-800"
                src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                alt=""
              />
              <img
                className="w-10 h-10 border-2 border-white rounded-full dark:border-gray-800"
                src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                alt=""
              />
              <img
                className="w-10 h-10 border-2 border-white rounded-full dark:border-gray-800"
                src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                alt=""
              />
              <a
                className="flex items-center justify-center w-10 h-10 text-xs font-medium text-white bg-gray-400 border-2 border-white rounded-full hover:bg-gray-500 dark:border-gray-800"
                href="#"
              >
                +3
              </a>
            </div>

            {/* <div className="flex items-center">

              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg shrink-0 focus:outline-none hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
              >
                <svg
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 16 3"
                >
                  <path d="M2 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6.041 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
                </svg>
              </button>



                    {open && (
        <div className="absolute right- mt-2 z-10 w-44 bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700">
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
            <li>
              <a
                href="#"
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              >
                Invite users
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              >
                Settings
              </a>
            </li>
          </ul>
        </div>
      )}

            </div> */}
          </div>
        </div>
      </div>
    </div>


  </div>


</div>

    </main>
  );
}