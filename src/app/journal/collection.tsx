import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export type Entry = {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  lastSavedAt?: string;
};

export type Collection = {
  id: string;
  name: string;
  isPrivate?: boolean;
  entries: Entry[];
};

const LOCAL_STORAGE_KEY = "jurnol_collections";
const PASSWORD_STORAGE_KEY = "collection_passwords";

const defaultCollectionsData: Collection[] = [
  {
    id: "default-my-notes",
    name: "My Notes",
    entries: [],
  },
  {
    id: uuidv4(), // Keep generating potential ID for default private
    name: "Private",
    isPrivate: true,
    entries: [],
  },
];

export function getDefaultCollection(): Collection {
  return { ...defaultCollectionsData[0] };
}

export function useCollections() {
  // Initialize state as empty initially to prevent hydration mismatch
  const [collections, setCollections] = useState<Collection[]>([]);
  const [passwordHashes, setPasswordHashes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Effect to load data from localStorage on client mount
  useEffect(() => {
    console.log("Attempting to load collections from localStorage...");
    let loadedCollections: Collection[] = [];
    let loadedHashes: Record<string, string> = {};

    // Load Collections
    try {
      const savedCollections = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedCollections) {
        const parsed = JSON.parse(savedCollections);
        if (Array.isArray(parsed) && parsed.every(c => c && typeof c.id === 'string' && typeof c.name === 'string' && Array.isArray(c.entries))) {
            // Ensure "My Notes" exists and is first (logic moved from getInitialCollections)
            const myNotesIndex = parsed.findIndex(c => c.id === "default-my-notes");
            if (myNotesIndex === -1) {
              parsed.unshift(getDefaultCollection());
            } else if (myNotesIndex > 0) {
              const myNotes = parsed.splice(myNotesIndex, 1)[0];
              myNotes.id = "default-my-notes";
              myNotes.name = "My Notes";
              parsed.unshift(myNotes);
            } else {
               parsed[0].id = "default-my-notes";
               parsed[0].name = "My Notes";
            }
            // Assign stable ID to default private collection if necessary (logic moved)
            const privateColIndex = parsed.findIndex(c => c.name === "Private" && c.isPrivate);
            const defaultPrivateId = defaultCollectionsData[1].id;
            if(privateColIndex > -1 && parsed[privateColIndex].id === defaultPrivateId) {
                 if(!parsed.some(c => c.id === defaultPrivateId && c.name !== "Private")) {
                    parsed[privateColIndex].id = uuidv4();
                 }
            }
          loadedCollections = parsed as Collection[];
          console.log("Collections loaded successfully:", loadedCollections);
        } else {
            console.warn("Invalid collections format found in localStorage.");
            loadedCollections = JSON.parse(JSON.stringify(defaultCollectionsData)); // Fallback
        }
      } else {
        console.log("No collections found in localStorage, using defaults.");
        loadedCollections = JSON.parse(JSON.stringify(defaultCollectionsData)); // Use defaults if nothing saved
      }
    } catch (e) {
      console.error("Error reading/parsing collections from localStorage:", e);
      loadedCollections = JSON.parse(JSON.stringify(defaultCollectionsData)); // Fallback
    }

    // Load Password Hashes
    try {
        const savedPasswords = localStorage.getItem(PASSWORD_STORAGE_KEY);
        if (savedPasswords) {
            const parsed = JSON.parse(savedPasswords);
            if (typeof parsed === 'object' && parsed !== null) {
                // Basic validation (logic moved)
                let validHashes = true;
                for (const key in parsed) {
                    if (typeof key !== 'string' || typeof parsed[key] !== 'string') {
                        validHashes = false;
                        break;
                    }
                }
                if (validHashes) {
                    loadedHashes = parsed as Record<string, string>;
                    console.log("Password hashes loaded successfully.");
                } else {
                     console.warn("Invalid password hash format found in localStorage.");
                }
            }
        }
    } catch(e) {
        console.error("Error reading/parsing password hashes from localStorage:", e);
    }

    // Set state after loading
    setCollections(loadedCollections);
    setPasswordHashes(loadedHashes);

    // Handle initial hashing for default private collection AFTER loading state
    const privateCollection = loadedCollections.find(c => c.name === "Private" && c.isPrivate);
    if (privateCollection && !loadedHashes[privateCollection.id]) {
        console.log("Setting initial password hash for default private collection...");
        bcrypt.hash("pass1", 10).then(hash => {
            // Use functional update based on the *latest* state
            setPasswordHashes(prev => {
                const newHashes = {...prev, [privateCollection.id]: hash };
                // Save updated hashes (will trigger the save effect below)
                return newHashes;
            });
        }).catch(err => {
           console.error("Failed to hash initial password:", err);
        });
    }

    setIsLoading(false); // Set loading to false
    console.log("Initial loading complete.");

  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to save collections to localStorage when they change (run only after initial load)
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    try {
        console.log("Saving collections to localStorage...");
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(collections));
    } catch (e) {
        console.error("Error saving collections to localStorage:", e);
    }
  }, [collections, isLoading]);

  // Effect to save password hashes to localStorage when they change (run only after initial load)
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    try {
      console.log("Saving password hashes to localStorage...");
      localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(passwordHashes));
    } catch (e) {
      console.error("Error saving password hashes to localStorage:", e);
    }
  }, [passwordHashes, isLoading]);


  const verifyPassword = async (
    collectionId: string,
    password: string
  ): Promise<boolean> => {
    const hash = passwordHashes[collectionId];
    return hash ? bcrypt.compare(password, hash) : false;
  };

  const validatePassword = (password: string): boolean => {
    return password.length > 0;
  };

  const saveEntry = (collectionId: string, entry: Entry) => {
    const now = new Date().toISOString();
    setCollections((prev) =>
      prev.map((col) =>
        col.id === collectionId
          ? {
              ...col,
              entries: col.entries.some((e) => e.id === entry.id)
                ? col.entries.map((e) =>
                    e.id === entry.id ? { ...e, ...entry, lastSavedAt: now } : e
                  )
                : [
                    { ...entry, createdAt: now, lastSavedAt: now },
                    ...col.entries,
                  ],
            }
          : col
      )
    );
  };

  const deleteEntry = (collectionId: string, entryId: string) => {
    setCollections((prev) =>
      prev.map((col) =>
        col.id === collectionId
          ? { ...col, entries: col.entries.filter((e) => e.id !== entryId) }
          : col
      )
    );
  };

  const addCollection = async (name: string, password?: string) => {
    const newCollection: Collection = {
      id: uuidv4(),
      name,
      isPrivate: Boolean(password),
      entries: [],
    };

    if (password) {
        if (!validatePassword(password)) {
            console.error("Invalid password format");
            return false; // Return false on validation failure
        }
      try {
          const hash = await bcrypt.hash(password, 10);
          setPasswordHashes((prev) => ({ ...prev, [newCollection.id]: hash }));
      } catch (error) {
           console.error("Failed to hash password for new collection:", error);
           return false; // Indicate failure
      }
    }

    setCollections((prev) => [...prev, newCollection]);
    return true; // Indicate success
  };

 const updateCollection = async (
    collectionId: string,
    updates: { name?: string; isPrivate?: boolean; password?: string },
    currentPassword?: string
  ) => {
    // Find collection using functional state update to ensure freshness
    let collectionToUpdate: Collection | undefined;
    setCollections(prev => {
        const collectionIndex = prev.findIndex(c => c.id === collectionId);
        if (collectionIndex === -1) return prev; // Not found
        collectionToUpdate = prev[collectionIndex];
        return prev; // No change yet
    });

    if (!collectionToUpdate) {
        console.error("Collection not found for update:", collectionId);
        return false;
    }

    // Prevent editing "My Notes" properties
    if (collectionToUpdate.id === "default-my-notes" && (updates.name || updates.isPrivate !== undefined || updates.password)) {
        console.warn("Cannot modify core properties of 'My Notes' collection.");
        return false;
    }

    // Verify current password if needed
    const needsAuth = updates.isPrivate === true || updates.password !== undefined || (collectionToUpdate.isPrivate && updates.name !== undefined);
    if (collectionToUpdate.isPrivate && needsAuth) {
        if (!currentPassword) {
             console.error("Current password required for this update.");
             return false;
        }
      const isValid = await verifyPassword(collectionId, currentPassword);
      if (!isValid) {
          console.error("Invalid current password.");
          return false;
      }
    }

    // Validate new password
    if (updates.password && !validatePassword(updates.password)) {
      console.error("Invalid new password format.");
      return false;
    }

    // --- Prepare State Updates --- 
    let newPasswordHash: string | null | undefined = undefined; // undefined: no change, null: remove, string: new hash

    if (updates.password) {
        try {
            newPasswordHash = await bcrypt.hash(updates.password, 10);
        } catch (error) {
            console.error("Failed to hash password for update:", error);
            return false;
        }
    } else if (updates.isPrivate === false && passwordHashes[collectionId]) {
        newPasswordHash = null; // Signal removal
    } else if (updates.isPrivate === true && !passwordHashes[collectionId] && !updates.password) {
        console.warn("Collection made private without providing a new password.");
        // Potentially return false here if password is required for private
        // return false;
    }

    // --- Apply State Updates --- 
    // Update password hashes first (if changing)
    if (newPasswordHash !== undefined) {
        setPasswordHashes((prevHashes) => {
            const updatedHashes = { ...prevHashes };
            if (newPasswordHash === null) {
                delete updatedHashes[collectionId];
            } else {
                updatedHashes[collectionId] = newPasswordHash;
            }
            return updatedHashes;
        });
    }

    // Update collection details
    setCollections((prev) =>
        prev.map((col) => {
            if (col.id === collectionId) {
                const collectionUpdates: Partial<Collection> = {};
                if (updates.name !== undefined) collectionUpdates.name = updates.name;
                if (updates.isPrivate !== undefined) collectionUpdates.isPrivate = updates.isPrivate;
                return { ...col, ...collectionUpdates };
            }
            return col;
        })
    );

    return true; // Indicate success
  };

  const deleteCollection = (collectionId: string) => {
    // Find collection using functional state update
     let collectionToDelete: Collection | undefined;
     setCollections(prev => {
         collectionToDelete = prev.find(c => c.id === collectionId);
         if (!collectionToDelete || collectionToDelete.id === "default-my-notes") {
             console.warn("Attempted to delete 'My Notes' or non-existent collection.");
             return prev; // No change
         }
         return prev.filter((c) => c.id !== collectionId);
     });

    if (collectionToDelete && collectionToDelete.id !== "default-my-notes") {
        setPasswordHashes((prev) => {
          const rest = { ...prev };
          delete rest[collectionId];
          return rest;
        });
    }
  };

  return {
    collections,
    passwordHashes, // May be needed for UI checks? Consider removing if not.
    isLoading, // Expose loading state for UI
    saveEntry,
    deleteEntry,
    addCollection,
    deleteCollection,
    verifyPassword,
    updateCollection,
    validatePassword,
  };
}

