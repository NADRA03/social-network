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
        setSession(res);               // set global session
        setSessionInStore(res);        // also update Zustand store
        console.log("Session loaded:", res);
      })
      .catch(() => {});
  }, [router, setSessionInStore]);

  return null;
}
