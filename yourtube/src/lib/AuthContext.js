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

// Build a user object from a Firebase user (works without backend)
const buildFirebaseUser = (firebaseUser) => ({
  name: firebaseUser.displayName,
  email: firebaseUser.email,
  image: firebaseUser.photoURL || "https://github.com/shadcn.png",
  _firebaseUid: firebaseUser.uid,
  // Backend fields will be added when sync completes
  _id: null,
  isPremium: false,
  channelname: null,
});

export const UserProvider = ({ children }) => {
  // Immediately restore from localStorage —  no flash of "Sign In"
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

  const handlegooglesignin = async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Redirect error:", error);
    }
  };

  // Try to sync Firebase user with our MongoDB backend.
  // On success: update user state with full backend data.
  // On failure: user is already set from Firebase — no logout, just log.
  const syncWithBackend = async (firebaseUser) => {
    try {
      const payload = {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        image: firebaseUser.photoURL || "https://github.com/shadcn.png",
      };
      const response = await axiosInstance.post("/user/login", payload);
      if (response?.data?.result) {
        login(response.data.result);
      }
    } catch (err) {
      console.warn(
        "Backend sync failed (non-fatal — using Firebase data):",
        err?.message
      );
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // ── Step 1: Handle redirect result (fires once after Google redirect) ──
      try {
        const result = await getRedirectResult(auth);
        if (result?.user && mounted) {
          // IMMEDIATELY set user from Firebase data so Sign In button vanishes
          const firebaseUser = result.user;
          const immediateUser = buildFirebaseUser(firebaseUser);
          login(immediateUser);

          // Then sync with backend in the background (updates _id, isPremium etc.)
          syncWithBackend(firebaseUser);
        }
      } catch (err) {
        // auth/unauthorized-domain = preview URL used, not fatal
        if (err?.code !== "auth/unauthorized-domain") {
          console.error("getRedirectResult error:", err);
        }
      }

      // ── Step 2: Firebase auth state observer ──
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!mounted) return;

        if (firebaseUser) {
          // User is authenticated in Firebase
          const savedUser = (() => {
            try {
              const s = localStorage.getItem("user");
              return s ? JSON.parse(s) : null;
            } catch {
              return null;
            }
          })();

          if (!savedUser) {
            // No saved session — set from Firebase immediately, sync in background
            login(buildFirebaseUser(firebaseUser));
            syncWithBackend(firebaseUser);
          }
          // If savedUser exists, keep it (already restored in useState initializer)
        } else {
          // Firebase says no user — only clear if there's no localStorage user
          // (protects against race conditions mid-redirect)
          const hasLocal = !!localStorage.getItem("user");
          if (!hasLocal) {
            setUser(null);
          }
        }

        setAuthLoading(false);
      });

      return unsubscribe;
    };

    let unsubFn = () => {};
    init().then((fn) => {
      if (fn) unsubFn = fn;
    });

    return () => {
      mounted = false;
      unsubFn();
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
