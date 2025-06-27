"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSession } from "../api";

export let session: any = null;

export const setSession = (s: any) => {
	session = s;
};

export default function SessionInitializer() {
	const router = useRouter();

	useEffect(() => {
		getSession()
			.then((res) => {
				setSession(res);
				console.log("Session loaded:", res);
			})
			.catch(() => {
				// router.replace("/welcome"); 
			});
	}, [router]);

	return null;
}