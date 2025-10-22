"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Save, AlertCircle, Loader2, BookOpen, Calendar, Clock, Lock } from "lucide-react";
import { useTime } from '@/contexts/TimeContext';
import { timeService } from '@/services/timeService';
import PageTransition from '@/components/PageTransition';
import { initializeAuth, collectionTokens } from '@/api/client';
import { useConsistentDate } from '@/hooks/useConsistentDate';
import { useToast } from '@/contexts/ToastContext';
import ConfirmationDialog from '@/components/ConfirmationDialog';

// Import types and hooks
import type { Entry, Collection, PasswordPrompt } from "../types";
import { useCollections } from "../hooks/useCollections";
import { formatCurrentDate } from "../utils";

const TextEditor = dynamic(() => import("@/components/textEditor"), { ssr: false });
const PasswordPromptModal = dynamic(
  () => import("../components/PasswordPromptModal").then(mod => ({ default: mod.PasswordPromptModal })),
  { ssr: false }
);

/**
 * Entry editor component for creating and editing journal entries
 * Provides rich text editing with backend integration and autosave
 */
function EntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { collections, saveEntry, getEntry, verifyPassword, isLoading: collectionsLoading, error: collectionsError } = useCollections();
  const { loading: timeLoading, getCurrentDate } = useTime();
  const { currentDate: consistentDate, isReady: dateReady } = useConsistentDate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [autoSaveTimeoutId, setAutoSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { getCurrentDateTime } = useTime();
  const [passwordPrompt, setPasswordPrompt] = useState<PasswordPrompt | null>(null);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const toast = useToast();
  
  const MAX_CHARACTERS = 100000;
  const MAX_TITLE_CHARACTERS = 100;
  const AUTOSAVE_DELAY = 30000; // 30 seconds

  // Authentication check and initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('REF_TOKEN');
      
      if (!token || token.startsWith('dummy-') || token === 'test-token') {
        // No valid authentication token; redirect to landing
        window.location.href = '/';
        return;
      }
      
      // Initialize authentication in axios client
      initializeAuth();
    }
  }, []);

  // Track changes for unsaved indicator and trigger autosave
  useEffect(() => {
    setHasUnsavedChanges(title.trim() !== "" || content.trim() !== "");
    
    // Clear existing autosave timeout
    if (autoSaveTimeoutId) {
      clearTimeout(autoSaveTimeoutId);
    }
    
    // Set new autosave timeout if there's content to save
    if ((title.trim() || content.trim()) && selectedCollectionId) {
      const timeoutId = setTimeout(() => {
        handleSave(true); // Auto save
      }, AUTOSAVE_DELAY);
      setAutoSaveTimeoutId(timeoutId);
    }
  }, [title, content, selectedCollectionId]);

  // Cleanup autosave timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutId) {
        clearTimeout(autoSaveTimeoutId);
      }
    };
  }, [autoSaveTimeoutId]);

  // Set collection ID and load entry data from URL
  useEffect(() => {
    const collectionId = searchParams.get('collection');
    const entryIdParam = searchParams.get('id');
    const titleParam = searchParams.get('title');

    if (collectionsLoading) return; // Wait for collections to load

    // If editing an existing entry, load it first to get its collection
    if (entryIdParam) {
      loadEntry(entryIdParam);
      return; // loadEntry will set the collection from the entry data
    }

    // Otherwise, handle collection selection for new entries
    if (collectionId && collections.some(c => c.id.toString() === collectionId)) {
      setSelectedCollectionId(collectionId);

      // If creating a new entry with a title, set the title
      if (titleParam) {
        setTitle(decodeURIComponent(titleParam));
      }
    } else if (collections.length > 0) {
      const defaultCol = collections.find((c) => c.name === "My Notes") || collections[0];
      if (defaultCol) {
        setSelectedCollectionId(defaultCol.id.toString());
        // If there's a title parameter and no specific collection, still set the title
        if (titleParam) {
          setTitle(decodeURIComponent(titleParam));
        }
      }
    }
  }, [collections, searchParams, collectionsLoading]);

  // Handle collection change with password gate for private collections
  const handleCollectionChange = (value: string) => {
    const col: Collection | undefined = collections.find(c => c.id.toString() === value);
    if (!col) return;
    const isPrivate = col.isPrivate ?? col.is_private;
    if (isPrivate) {
      const token = collectionTokens.get(value);
      if (!token) {
        setPasswordPrompt({ collectionId: value, name: col.name });
        setEnteredPassword("");
        return; // wait for password before switching
      }
    }
    setSelectedCollectionId(value);
  };

  const handlePasswordSubmit = async () => {
    if (!passwordPrompt) return;
    const ok = await verifyPassword(passwordPrompt.collectionId, enteredPassword);
    if (ok) {
      setPasswordPrompt(null);
      setEnteredPassword("");
      setSelectedCollectionId(passwordPrompt.collectionId);

      // If we were trying to load an entry, retry now that we have the token
      if (entryId) {
        await loadEntry(entryId);
      }
    } else {
      toast.showError('Invalid password for this collection');
    }
  };

  const handleClosePasswordPrompt = () => {
    setPasswordPrompt(null);
    setEnteredPassword("");
  };

  const loadEntry = async (id: string) => {
    setIsLoadingEntry(true);
    try {
      setEntryId(id);

      // Get the collection ID from URL if provided
      const collectionIdFromUrl = searchParams.get('collection');

      // First, try to find the entry in local collections to get its collection ID
      let foundCollectionId: string | undefined = collectionIdFromUrl || undefined;
      for (const collection of collections) {
        const localEntry = collection.entries.find(e => e.id === id);
        if (localEntry) {
          foundCollectionId = collection.id.toString();
          console.log('📝 [LOAD ENTRY] Found entry in collection:', foundCollectionId);
          break;
        }
      }

      // If we have a collection ID, check if it's private and we need a token
      if (foundCollectionId) {
        const collection = collections.find(c => c.id.toString() === foundCollectionId);
        const isPrivate = collection?.isPrivate ?? collection?.is_private;

        if (isPrivate) {
          const token = collectionTokens.get(foundCollectionId);
          if (!token) {
            // Need to prompt for password before loading the entry
            console.log('🔐 [LOAD ENTRY] Private collection requires password');
            setPasswordPrompt({
              collectionId: foundCollectionId,
              name: collection?.name || 'Private Collection'
            });
            setIsLoadingEntry(false);
            return;
          }
        }
      }

      // Fetch the entry from the server with the collection ID (for access token)
      const entry = await getEntry(id, foundCollectionId);
      if (entry) {
        setTitle(entry.title || "");
        setContent(entry.content || "");
        setHasUnsavedChanges(false);

        // Set the collection ID from the entry data
        if (entry.collection_id) {
          setSelectedCollectionId(entry.collection_id.toString());
        }

        // Update character count when loading entry
        const text = entry.content ? entry.content.replace(/<[^>]*>/g, '') : '';
        setCharCount(text.length);
        setWordCount(text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0);
      } else {
        // Entry not found, try to find it in collections
        const collection = collections.find(c => c.id.toString() === selectedCollectionId);
        const localEntry = collection?.entries.find(e => e.id === id);
        if (localEntry) {
          setTitle(localEntry.title || "");
          setContent(localEntry.content || "");
          setHasUnsavedChanges(false);

          // Set the collection ID from the local entry data
          if (localEntry.collection_id) {
            setSelectedCollectionId(localEntry.collection_id.toString());
          }

          // Update character count when loading local entry
          const text = localEntry.content ? localEntry.content.replace(/<[^>]*>/g, '') : '';
          setCharCount(text.length);
          setWordCount(text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0);
        }
      }
    } catch (error) {
      console.error("Failed to load entry:", error);
      setSaveError("Failed to load entry. You can still edit and save.");
    } finally {
      setIsLoadingEntry(false);
    }
  };

  const [formattedDate, setFormattedDate] = useState("Loading...");
  
  // Update formatted date when consistent date changes
  useEffect(() => {
    if (dateReady && consistentDate && consistentDate !== 'Loading...') {
      const formatted = formatCurrentDate(consistentDate);
      setFormattedDate(formatted);
      
    }
  }, [consistentDate, dateReady]);
  

  const handleSave = async (isAutoSave = false) => {
    if (!selectedCollectionId) {
      if (!isAutoSave) setSaveError("Please select a collection first");
      return false;
    }

    if (!title.trim() && !content.trim()) {
      if (!isAutoSave) setSaveError("Entry cannot be empty");
      return false;
    }

    if (charCount > MAX_CHARACTERS) {
      if (!isAutoSave) setSaveError(`Entry exceeds the maximum limit of ${MAX_CHARACTERS.toLocaleString()} characters`);
      return false;
    }

    // Validate that the selected collection exists
    const selectedCollection = collections.find(c => c.id.toString() === selectedCollectionId);
    if (!selectedCollection) {
      if (!isAutoSave) setSaveError(`Selected collection (ID: ${selectedCollectionId}) not found. Please refresh and try again.`);
      return false;
    }

    // Ensure we have access to private collections before proceeding
    const isPrivate = selectedCollection.isPrivate ?? selectedCollection.is_private;
    if (isPrivate) {
      const token = selectedCollectionId ? collectionTokens.get(selectedCollectionId) : null;
      if (!token) {
        if (!isAutoSave) {
          setPasswordPrompt({ collectionId: selectedCollectionId!, name: selectedCollection.name });
        }
        return false;
      }
    }

    // For new entries, don't generate an ID - let the backend assign it
    // For existing entries, use the stored entryId from previous saves
    const currentEntryId = entryId;
    
    // Saving entry
    console.log('Saving entry:', {
      collectionId: selectedCollectionId,
      collectionName: selectedCollection.name,
      collectionIdInt: parseInt(selectedCollectionId),
      isUpdate: !!entryId,
      entryId: currentEntryId,
      isAutoSave
    });

    try {
      if (isAutoSave) {
        setIsAutoSaving(true);
      } else {
        setIsSaving(true);
      }
      setSaveError(null);
      
      const currentDateTime = getCurrentDateTime();
      const entry: Entry = {
        id: currentEntryId || "", // Will be assigned by backend for new entries
        title: title.trim() || "Untitled Entry",
        content,
        collection_id: parseInt(selectedCollectionId),
        created_at: entryId ? undefined : currentDateTime,
        updated_at: currentDateTime,
        // Frontend-friendly aliases
        createdAt: entryId ? undefined : currentDateTime,
        lastSavedAt: currentDateTime,
      };

      // Entry data and time service state
      console.log('Time service state:', {
        mockDate: timeService.getCurrentDate(),
        mockDateTime: timeService.getCurrentDateTime(),
        isMockActive: timeService.isMockDate(),
        expectedInBackend: 'Should use TimeService.get_current_time_for_user(user)'
      });

      const savedEntry = await saveEntry(selectedCollectionId, entry);
      
      if (savedEntry) {
        // Set the entry ID from the backend response for future autosaves
        if (!entryId && savedEntry.id) {
          setEntryId(savedEntry.id);
        }
        
        // Saved successfully
        setHasUnsavedChanges(false);
        setLastSavedTime(new Date());
        if (!isAutoSave) {
          router.push("/journal");
        }
        return true;
      } else {
        if (!isAutoSave) setSaveError("Failed to save entry. Please check the console for details and try again.");
        return false;
      }
    } catch (error) {
      console.error("💥 Failed to save entry:", error);
      if (!isAutoSave) setSaveError(`Failed to save entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      if (isAutoSave) {
        setIsAutoSaving(false);
      } else {
        setIsSaving(false);
      }
    }
  };

  const handleCountUpdate = (counts: { words: number; chars: number }) => {
    setWordCount(counts.words);
    setCharCount(counts.chars);
    
    // Clear existing autosave timeout
    if (autoSaveTimeoutId) {
      clearTimeout(autoSaveTimeoutId);
    }
    
    // Set new autosave timeout if there's content to save
    if ((title.trim() || content.trim()) && selectedCollectionId) {
      const timeoutId = setTimeout(() => {
        handleSave(true); // Auto save
      }, AUTOSAVE_DELAY);
      setAutoSaveTimeoutId(timeoutId);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedConfirm(true);
      return;
    }
    router.push("/journal");
  };

  // Show loading state while collections are loading or time service is not ready
  if (collectionsLoading || timeLoading || !dateReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A2537]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center space-x-3 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-lg font-medium">Loading your journal...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error if collections failed to load
  if (collectionsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Unable to Load Journal</h2>
          <p className="text-gray-300 mb-8 leading-relaxed">{collectionsError}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 font-medium"
            >
              <Loader2 className="w-5 h-5" />
              Retry Loading
            </button>
            <button
              onClick={handleBack}
              className="w-full px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium"
            >
              Back to Journal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      {/* Full-page layout without gradients */}
      <div className="min-h-screen flex flex-col bg-[#1A2537]">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBack}
                className="group inline-flex items-center gap-3 px-4 py-3 bg-[#293344] border border-[#293344] text-gray-200 hover:text-white rounded-xl transition-all duration-200 hover:bg-[#293344] transform hover:scale-105"
                aria-label="Return to journal"
              >
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="font-medium">Back to Journal</span>
              </button>
              
              <div className="flex items-center gap-4">
                {/* Collection Selector */}
                <div className="relative">
                  <select
                    value={selectedCollectionId || ""}
                    onChange={(e) => handleCollectionChange(e.target.value)}
                    className="appearance-none px-4 py-3 pr-10 bg-[#293344] border border-[#293344] text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-[#293344]"
                    aria-label="Select collection for this entry"
                    disabled={isSaving || isLoadingEntry}
                  >
                    <option value="" disabled>Select Collection</option>
                    {collections.map(col => (
                      <option key={col.id} value={col.id}>
                        {col.name} {col.isPrivate ? " (Private)" : ""}
                      </option>
                    ))}
                  </select>
                  <BookOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Save Button */}
                <button
                  onClick={() => handleSave(false)}
                  disabled={!selectedCollectionId || isSaving || isLoadingEntry || (!title.trim() && !content.trim())}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 font-medium shadow-lg"
                  aria-label={isSaving ? "Saving entry..." : "Save entry"}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Entry</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {saveError && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-900/50 to-pink-900/50 backdrop-blur-sm border border-red-600/50 rounded-xl animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
                  <span className="text-red-200 flex-1">{saveError}</span>
                  <button
                    onClick={() => setSaveError(null)}
                    className="ml-3 text-red-400 hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-500/20"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>

            {/* Editor Surface - full-width translucent panel with internal scroll */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col max-h-[calc(100vh-160px)] relative">
            {/* Editor Header */}
              <div className="p-6 sm:p-8 bg-transparent rounded-t-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/15 border border-blue-500/30 text-blue-300 text-sm rounded-lg">
                    <Calendar className="w-4 h-4" />
                    <span>{formattedDate}</span>
                  </div>
                  
                  {isLoadingEntry && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-sm rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading entry...</span>
                    </div>
                  )}
                </div>
                  
                  <div className="flex items-center gap-4 text-gray-300 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {isAutoSaving ? (
                      <span className="text-blue-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Auto-saving...
                      </span>
                    ) : lastSavedTime ? (
                      <span>Last saved: {timeService.isReady() ? new Date(lastSavedTime).toLocaleTimeString('en-US', { timeZone: timeService.getUserTimezone() }) : lastSavedTime.toLocaleTimeString()}</span>
                    ) : (
                      <span>Not saved yet</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span>{wordCount.toLocaleString()} words</span>
                    <span className={`${charCount > MAX_CHARACTERS * 0.9 ? 'text-yellow-400' : charCount > MAX_CHARACTERS ? 'text-red-400' : 'text-gray-400'}`}>
                      {charCount.toLocaleString()}/{MAX_CHARACTERS.toLocaleString()} characters
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Title Input */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    if (newTitle.length <= MAX_TITLE_CHARACTERS) {
                      setTitle(newTitle);
                    }
                  }}
                  placeholder="What's on your mind today?"
                  className="w-full text-4xl font-bold bg-transparent text-white placeholder-gray-500 focus:outline-none focus:ring-0 transition-all duration-200 border-none"
                  autoFocus={!isLoadingEntry}
                  disabled={isSaving || isLoadingEntry}
                  aria-label="Entry title"
                />
                {title.length >= MAX_TITLE_CHARACTERS && (
                  <div className="mt-2 text-sm text-red-400">
                    Title cannot exceed {MAX_TITLE_CHARACTERS} characters
                  </div>
                )}
              </div>
            </div>

            {/* Content Editor (scrollable) */}
              <div className="flex-1 overflow-y-auto pt-0 pb-8 px-6 sm:px-8 bg-transparent">
                {/* Spacer to keep content clear of sticky toolbar while scrolling */}
                <div className="h-3"></div>
              {/* Character limit warning */}
              {charCount > MAX_CHARACTERS * 0.9 && (
                <div className={`mb-4 p-3 rounded-xl border ${
                  charCount > MAX_CHARACTERS 
                    ? 'bg-red-900/50 border-red-600/50 text-red-200' 
                    : 'bg-yellow-900/50 border-yellow-600/50 text-yellow-200'
                }`}>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {charCount > MAX_CHARACTERS ? (
                      <span>Character limit exceeded! Please remove {(charCount - MAX_CHARACTERS).toLocaleString()} characters.</span>
                    ) : (
                      <span>Approaching character limit. {(MAX_CHARACTERS - charCount).toLocaleString()} characters remaining.</span>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <TextEditor
                  value={content}
                  onChange={setContent}
                  onCountUpdate={handleCountUpdate}
                  disabled={isSaving || isLoadingEntry}
                  maxCharacters={MAX_CHARACTERS}
                />
              </div>


            </div>
          </div>
          </div>
        </div>
      </div>
      {/* Password Prompt Modal */}
      <PasswordPromptModal
        passwordPrompt={passwordPrompt}
        enteredPassword={enteredPassword}
        onPasswordChange={setEnteredPassword}
        onSubmit={handlePasswordSubmit}
        onClose={handleClosePasswordPrompt}
      />
      <ConfirmationDialog
        isOpen={showUnsavedConfirm}
        onClose={() => setShowUnsavedConfirm(false)}
        onConfirm={() => router.push('/journal')}
        title="Unsaved changes"
        message="You have unsaved changes. Leave without saving?"
        confirmText="Leave"
        cancelText="Stay"
      />
    </PageTransition>
  );
}

/**
 * Entry page wrapper with Suspense boundary
 * Handles loading states for search params
 */
export default function Entry() {
  // Remove suspense fallback UI to avoid component-level loading; page renders together
  return <EntryContent />;
}