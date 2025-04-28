import React, { createContext, useContext, useState, useEffect } from 'react';
import { startOfDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export interface Entry {
  id: string;
  date: string;
  content: string;
}

interface EntryContextType {
  entries: Entry[];
  currentEntry: Entry | null;
  setCurrentEntry: (entry: Entry | null) => void;
  updateEntryContent: (id: string, content: string) => void;
  createNewEntry: () => void;
  deleteEntry: (id: string) => void;
}

const EntryContext = createContext<EntryContextType | null>(null);

export function EntryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);

  // Load entries and initialize today's entry if needed
  useEffect(() => {
    const savedEntries = localStorage.getItem('typein-entries');
    let loadedEntries: Entry[] = [];
    
    try {
      loadedEntries = savedEntries ? JSON.parse(savedEntries) : [];
    } catch (error) {
      console.error('Failed to parse saved entries:', error);
      loadedEntries = [];
    }
    
    // Sort entries by date (newest first)
    loadedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Check if we have today's entry
    const today = startOfDay(new Date()).toISOString();
    const todayEntry = loadedEntries.find(entry => 
      startOfDay(new Date(entry.date)).toISOString() === today
    );

    if (!todayEntry) {
      // Create today's entry
      const newEntry: Entry = {
        id: uuidv4(),
        date: new Date().toISOString(),
        content: ''
      };
      loadedEntries = [newEntry, ...loadedEntries];
      setCurrentEntry(newEntry);
    } else {
      setCurrentEntry(todayEntry);
    }

    setEntries(loadedEntries);
    localStorage.setItem('typein-entries', JSON.stringify(loadedEntries));
  }, []);

  const updateEntryContent = (id: string, content: string) => {
    const updatedEntries = entries.map(entry =>
      entry.id === id ? { ...entry, content } : entry
    );
    setEntries(updatedEntries);
    localStorage.setItem('typein-entries', JSON.stringify(updatedEntries));
  };

  const createNewEntry = () => {
    const newEntry: Entry = {
      id: uuidv4(),
      date: new Date().toISOString(),
      content: ''
    };
    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    setCurrentEntry(newEntry);
    localStorage.setItem('typein-entries', JSON.stringify(updatedEntries));
  };

  const deleteEntry = (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    
    // If we deleted the current entry or if there are no entries left
    if (currentEntry?.id === id || updatedEntries.length === 0) {
      // If there are remaining entries, switch to the first one
      if (updatedEntries.length > 0) {
        setCurrentEntry(updatedEntries[0]);
      } else {
        // If no entries left, clear current entry and create a new one
        setCurrentEntry(null);
        const newEntry: Entry = {
          id: uuidv4(),
          date: new Date().toISOString(),
          content: ''
        };
        setEntries([newEntry]);
        setCurrentEntry(newEntry);
        localStorage.setItem('typein-entries', JSON.stringify([newEntry]));
        return;
      }
    }
    localStorage.setItem('typein-entries', JSON.stringify(updatedEntries));
  };

  return (
    <EntryContext.Provider
      value={{
        entries,
        currentEntry,
        setCurrentEntry,
        updateEntryContent,
        createNewEntry,
        deleteEntry
      }}
    >
      {children}
    </EntryContext.Provider>
  );
}

export function useEntries() {
  const context = useContext(EntryContext);
  if (!context) {
    throw new Error('useEntries must be used within an EntryProvider');
  }
  return context;
} 