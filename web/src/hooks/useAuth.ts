'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setProfileError(null);
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          setProfile(snap.exists() ? (snap.data() as AppUser) : null);
        } catch (err) {
          setProfile(null);
          setProfileError((err as Error).message);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  return {
    firebaseUser,
    profile,
    profileError,
    loading,
    isEditor: profile?.role === 'admin' || profile?.role === 'editor'
  };
}
