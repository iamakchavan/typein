import pako from 'pako';

const STORAGE_KEY = 'editor-content';
const HISTORY_KEY = 'editor-history';

interface StorageData {
  content: string;
  history: string[];
  historyIndex: number;
}

/**
 * Compress and save content to local storage
 */
export const saveToLocalStorage = (data: StorageData): void => {
  try {
    // Convert string to Uint8Array
    const textEncoder = new TextEncoder();
    const contentUint8 = textEncoder.encode(JSON.stringify(data));
    
    // Compress the content
    const compressed = pako.deflate(contentUint8);
    
    // Convert to base64 for storage
    const base64 = btoa(String.fromCharCode.apply(null, compressed as unknown as number[]));
    
    localStorage.setItem(STORAGE_KEY, base64);
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    // Fallback to uncompressed storage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (fallbackError) {
      console.error('Failed to save uncompressed content:', fallbackError);
    }
  }
};

/**
 * Load and decompress content from local storage
 */
export const loadFromLocalStorage = (): StorageData | null => {
  try {
    const compressed = localStorage.getItem(STORAGE_KEY);
    if (!compressed) return null;
    
    // Try to decompress (assuming it's compressed)
    try {
      // Convert base64 to Uint8Array
      const binaryString = atob(compressed);
      const uint8Array = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
      
      // Decompress
      const decompressed = pako.inflate(uint8Array);
      
      // Convert back to string
      const textDecoder = new TextDecoder();
      const decodedData = textDecoder.decode(decompressed);
      return JSON.parse(decodedData);
    } catch {
      // If decompression fails, assume it's uncompressed content
      try {
        return JSON.parse(compressed);
      } catch {
        // If parsing fails, assume it's legacy content
        return {
          content: compressed,
          history: [compressed],
          historyIndex: 0
        };
      }
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}