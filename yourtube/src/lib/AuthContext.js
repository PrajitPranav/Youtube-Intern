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

    }
  };

  const handlegooglesignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        const firebaseUser = result.user;

        const immediateUser = {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          image: firebaseUser.photoURL || "https://github.com/shadcn.png",
          _id: null,
          isPremium: false,
          channelname: null,
        };
        login(immediateUser);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {

        const savedUser = (() => {
          try {
            const s = localStorage.getItem("user");
            return s ? JSON.parse(s) : null;
          } catch {
            return null;
          }
        })();

        if (!savedUser || !savedUser._id) {

          syncWithBackend(firebaseUser);
        }
      } else {

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
