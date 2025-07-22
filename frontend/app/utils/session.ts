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
    getSession().then((res) => {
      if (res?.unauthorized) {
        console.log("Unauthorized - resetting session");
        setSession(null);
        setSessionInStore(null);
      } else {
        setSession(res);
        setSessionInStore(res);
        console.log("Session loaded:", res);
      }
    });
  }, [router, setSessionInStore]);

  return null;
}

export async function loadSession(setSessionInStore: (s: any) => void) {
  const res = await getSession();
  if (res?.unauthorized) {
    console.log("401 received during session load. Resetting session.");
    setSession(null);
    setSessionInStore(null);
  } else {
    setSession(res);
    setSessionInStore(res);
    console.log("Session loaded:", res);
  }
}


