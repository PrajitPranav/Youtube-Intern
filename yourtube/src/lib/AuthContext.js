import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import { useState, useEffect, useContext, createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Restore user from localStorage IMMEDIATELY on mount (before any async ops)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);

  const login = (userdata) => {
    setUser(userdata);
    localStorage.setItem("user", JSON.stringify(userdata));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("user");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Called when user clicks "Sign In" — redirects to Google
  const handlegooglesignin = async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Redirect error:", error);
    }
  };

  // Helper: sync Firebase user to our backend and update app state
  const syncUserWithBackend = async (firebaseuser) => {
    try {
      const payload = {
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image: firebaseuser.photoURL || "https://github.com/shadcn.png",
      };
      const response = await axiosInstance.post("/user/login", payload);
      if (response?.data?.result) {
        login(response.data.result);
      }
    } catch (error) {
      // Backend call failed — keep existing localStorage session if it exists
      // Do NOT logout here; user may still be authenticated from a previous session
      console.error("Backend sync error (non-fatal):", error?.message);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Step 1: Check if we're returning from a Google redirect
      try {
        const result = await getRedirectResult(auth);
        if (result?.user && mounted) {
          await syncUserWithBackend(result.user);
        }
      } catch (error) {
        // This can throw auth/unauthorized-domain for preview URLs — not fatal
        if (error?.code !== "auth/unauthorized-domain") {
          console.error("getRedirectResult error:", error);
        }
      }

      // Step 2: Listen for ongoing Firebase auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (firebaseuser) => {
        if (!mounted) return;

        if (firebaseuser) {
          // Only call backend if we don't already have a user in state
          // (avoids double-calling every page load)
          const currentUser = localStorage.getItem("user");
          if (!currentUser) {
            await syncUserWithBackend(firebaseuser);
          }
        }
        // Note: we do NOT clear user state when firebaseuser is null
        // because that could be a race condition during redirect
        setAuthLoading(false);
      });

      return unsubscribe;
    };

    let cleanup = () => {};
    init().then((unsub) => {
      if (unsub) cleanup = unsub;
    });

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  return (
    <UserContext.Provider
      value={{ user, login, logout, handlegooglesignin, authLoading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
