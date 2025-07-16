"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSession } from "../api";
import { useSessionStore } from "./store";

export let session: any = null;

export const setSession = (s: any) => {
	session = s;
};

export default function SessionInitializer() {
  const router = useRouter();
  const setSessionInStore = useSessionStore((state) => state.setSession);

  useEffect(() => {
    getSession()
      .then((res) => {
        setSession(res);              
        setSessionInStore(res);        
        console.log("Session loaded:", res);
      })
      .catch(() => {});
  }, [router, setSessionInStore]);

  return null;
}

export async function loadSession(setSessionInStore: (s: any) => void) {
  const session = await getSession();
  if (session) {
    setSession(session);
    setSessionInStore(session);
    console.log("Session loaded:", session);
  }
}
