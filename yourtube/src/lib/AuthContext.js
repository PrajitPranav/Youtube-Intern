import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { useState, useEffect, useContext, createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Restore from localStorage immediately — no flash of "not logged in"
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
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
    try {
      localStorage.setItem("user", JSON.stringify(userdata));
    } catch {}
  };

  const logout = async () => {
    setUser(null);
    try {
      localStorage.removeItem("user");
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Sync Firebase user with backend — non-fatal if backend is slow/down
  const syncWithBackend = async (firebaseUser) => {
    try {
      const payload = {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        image: firebaseUser.photoURL || "https://github.com/shadcn.png",
      };
      const response = await axiosInstance.post("/user/login", payload);
      if (response?.data?.result) {
        login(response.data.result); // Updates with full backend data (_id, channelname, etc.)
      }
    } catch (err) {
      console.warn("Backend sync failed (non-fatal):", err?.message);
      // User stays logged in via Firebase data stored in localStorage
    }
  };

  // POPUP-based sign in — works because domain is now authorized in Firebase
  const handlegooglesignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        const firebaseUser = result.user;

        // Immediately set user so Sign In button vanishes
        const immediateUser = {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          image: firebaseUser.photoURL || "https://github.com/shadcn.png",
          _id: null,
          isPremium: false,
          channelname: null,
        };
        login(immediateUser);

        // Sync with backend in background to get full user data
        syncWithBackend(firebaseUser);
      }
    } catch (error) {
      console.error("Sign-in error:", error?.code, error?.message);
      if (error?.code === "auth/popup-blocked") {
        alert(
          "Popup was blocked by your browser. Please allow popups for this site and try again."
        );
      } else if (error?.code === "auth/unauthorized-domain") {
        alert(
          "This domain is not authorized. Please contact the administrator."
        );
      }
    }
  };

  // Restore session on mount and keep listening for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase session exists — check if we have full backend data
        const savedUser = (() => {
          try {
            const s = localStorage.getItem("user");
            return s ? JSON.parse(s) : null;
          } catch {
            return null;
          }
        })();

        if (!savedUser || !savedUser._id) {
          // No backend data yet — sync in background
          syncWithBackend(firebaseUser);
        }
      } else {
        // Firebase says no session — clear state only if no local data
        const hasLocal = !!localStorage.getItem("user");
        if (!hasLocal) {
          setUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
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
