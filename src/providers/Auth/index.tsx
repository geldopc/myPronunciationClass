import {
	signOut as firebaseSignOut,
	onAuthStateChanged,
	signInWithPopup,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

import { auth, googleProvider } from "@/lib/firebase";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export type AuthUser = {
	uid: string;
	email: string;
	displayName: string;
	avatarUrl: string;
};

const MOCK_USER: AuthUser = {
	uid: "mock-user-001",
	email: "geldopc@gmail.com",
	displayName: "Dev User",
	avatarUrl: "",
};

type AuthContextValue = {
	user: AuthUser | null;
	loading: boolean;
	signInWithGoogle: () => Promise<void>;
	signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (USE_MOCK) {
			setUser(MOCK_USER);
			setLoading(false);
			return;
		}
		return onAuthStateChanged(auth, (firebaseUser) => {
			setUser(
				firebaseUser
					? {
							uid: firebaseUser.uid,
							email: firebaseUser.email ?? "",
							displayName: firebaseUser.displayName ?? "Aluno",
							avatarUrl: firebaseUser.photoURL ?? "",
						}
					: null
			);
			setLoading(false);
		});
	}, []);

	async function signInWithGoogle() {
		await signInWithPopup(auth, googleProvider);
	}

	async function signOut() {
		await firebaseSignOut(auth);
	}

	return (
		<AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
