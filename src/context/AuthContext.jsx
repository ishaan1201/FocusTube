import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Session Check
    getSession();

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          fetchProfile(currentUser.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        // 🚀 THE MAGIC: Silently create a guest account if no session exists
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) throw anonError;
        
        if (anonData?.user) {
          setUser(anonData.user);
          await fetchProfile(anonData.user.id);
        }
      }
    } catch (err) {
      console.error("Session fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (id) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password });

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signInAnonymously = () =>
    supabase.auth.signInAnonymously();

  const signOut = () => {
    setUser(null);
    setProfile(null);
    return supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signUp, signIn, signInAnonymously, signOut, fetchProfile, refreshProfile }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
