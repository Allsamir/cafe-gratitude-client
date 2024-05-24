import React, { createContext, useEffect, useState } from "react";
import {
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../config/firebase.config";
import useSecureAxios from "../hooks/useSecureAxios";
import NUser from "../interfaces/NUser";
import usePublicAxios from "../hooks/usePublicAxios";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  createUser: (email: string, password: string) => Promise<UserCredential>;
  loginUser: (email: string, password: string) => Promise<UserCredential>;
  googleProvider: () => Promise<UserCredential>;
  role: NUser | null;
  logOutUser: () => Promise<void>;
}

interface ChildProps {
  children: React.ReactNode;
}
export const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<ChildProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const provider = new GoogleAuthProvider();
  const [loading, setLoading] = useState(true);
  const secureAxios = useSecureAxios();
  const publicAxios = usePublicAxios();
  const [role, setRole] = useState<NUser | null>(null);
  const createUser = (email: string, password: string) => {
    setLoading(true);
    return createUserWithEmailAndPassword(auth, email, password);
  };
  const loginUser = (email: string, password: string) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, password);
  };
  const logOutUser = () => {
    return signOut(auth);
  };
  const googleProvider = () => {
    setLoading(true);
    return signInWithPopup(auth, provider);
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        publicAxios
          .post(`/jwt`, { email: user.email })
          .then((res) => {
            localStorage.setItem("token", JSON.stringify(res.data.token));
          })
          .catch((err) => {
            console.error(err);
          });
      } else {
        localStorage.removeItem("token");
      }
      setLoading(false);
    });
    secureAxios
      .get(`/single-user?email=${user?.email}`)
      .then((res) => setRole(res.data));
    return () => {
      return unsubscribe();
    };
  }, [secureAxios, user]);
  const authInfo = {
    user,
    loading,
    setLoading,
    createUser,
    loginUser,
    logOutUser,
    googleProvider,
    role,
  };
  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
