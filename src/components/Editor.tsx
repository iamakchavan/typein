import { useCallback, useEffect, useReducer, useState } from 'react';
import { editorReducer } from '@/lib/editorReducer';
import { fonts } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { StatusBar } from '@/components/StatusBar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowDownToLine, MoonIcon, SunIcon, Type, Undo2,
  Redo2, Settings, Menu } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { Sidebar } from '@/components/Sidebar';
import { useEntries } from '@/contexts/EntryContext';

// Custom Fullscreen icons
const FullscreenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="M3 7V3h4" />
    <path d="M21 7V3h-4" />
    <path d="M3 17v4h4" />
    <path d="M21 17v4h-4" />
  </svg>
);

const ExitFullscreenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="M7 3v4H3" />
    <path d="M17 3v4h4" />
    <path d="M7 21v-4H3" />
    <path d="M17 21v-4h4" />
  </svg>
);

export function Editor() {
  // Theme handling
  const { theme, setTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Font handling
  const [selectedFont, setSelectedFont] = useState('geist');
  const [fontSize, setFontSize] = useState(20);

  // Scroll state
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Get entries context
  const { currentEntry, updateEntryContent } = useEntries();

  // Initialize editor state
  const [state, dispatch] = useReducer(editorReducer, {
    content: currentEntry?.content || '',
    baseContent: currentEntry?.content || '',
    lastSaved: null,
    isDirty: false,
    history: [],
    historyIndex: 0,
  });

  // Keyboard shortcuts
  useKeyboardShortcut({ key: 's', metaKey: true }, (e) => {
    e.preventDefault();
    dispatch({ type: 'SAVE' });
  });

  useKeyboardShortcut({ key: 'z', metaKey: true }, (e) => {
    e.preventDefault();
    dispatch({ type: 'UNDO' });
  });

  useKeyboardShortcut({ key: 'y', metaKey: true }, (e) => {
    e.preventDefault();
    dispatch({ type: 'REDO' });
  });

  // Load content from localStorage when component mounts
  useEffect(() => {
    dispatch({
      type: 'INIT',
      payload: { content: '' }
    });
  }, []);

  // Update editor content when current entry changes
  useEffect(() => {
    if (currentEntry) {
      dispatch({ 
        type: 'INIT', 
        payload: { content: currentEntry.content }
      });
    } else {
      // Clear content if there's no current entry
      dispatch({
        type: 'INIT',
        payload: { content: '' }
      });
    }
  }, [currentEntry]);

  // Save content changes to current entry
  useEffect(() => {
    if (currentEntry && state.isDirty) {
      updateEntryContent(currentEntry.id, state.content);
      dispatch({ type: 'SAVE' });
    }
  }, [state.content, state.isDirty, currentEntry, updateEntryContent]);

  // Handle content changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_CONTENT', payload: e.target.value });
  }, []);

  // Handle textarea scroll
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const isNearBottom = textarea.scrollHeight - textarea.scrollTop - textarea.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
      setShowScrollButton(false);
    }
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Update fullscreen state when exiting via Esc key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Calculate stats
  const wordCount = (state.content || '').trim() ? (state.content || '').trim().split(/\s+/).length : 0;
  const charCount = (state.content || '').length;

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <header className="h-12 px-4 flex justify-between items-center border-b border-border/10">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Select value={selectedFont} onValueChange={setSelectedFont}>
            <SelectTrigger 
              className={cn(
                "h-8 w-[200px] hover:bg-primary/10 transition-colors border-border",
                {
                'font-geist': selectedFont === 'geist',
                'font-space': selectedFont === 'space',
                'font-lora': selectedFont === 'lora',
                'font-instrument-italic italic': selectedFont === 'instrument-italic',
                }
              )}
            >
              <Type className="h-4 w-4 text-muted-foreground mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent 
              className="min-w-[200px] border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
              position="popper"
              sideOffset={4}
            >
              {fonts.map(font => (
                <SelectItem 
                  key={font.value} 
                  value={font.value}
                  className={cn(
                    "text-base cursor-pointer transition-colors",
                    "data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary",
                    {
                      'font-geist': font.value === 'geist',
                      'font-space': font.value === 'space',
                      'font-lora': font.value === 'lora',
                      'font-instrument-italic italic': font.value === 'instrument-italic',
                    }
                  )}
                >
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="hidden md:flex h-8 w-8 hover:bg-primary/10 hover:text-primary"
          >
            {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            <span className="sr-only">Toggle fullscreen</span>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">Font Size</h4>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[fontSize]}
                    onValueChange={([value]) => setFontSize(value)}
                    max={28}
                    min={16}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm text-muted-foreground">
                    {fontSize}px
                  </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Theme</h4>
                  <div className="flex items-center justify-between gap-2 p-1 bg-muted/30 rounded-xl">
                    <Button
                      variant={theme === 'light' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTheme('light')}
                      className={cn(
                        'w-1/2 gap-2 rounded-lg transition-colors duration-300',
                        theme === 'light'
                          ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                          : 'hover:bg-muted/60 hover:text-foreground',
                        'border border-border',
                        theme === 'light' ? 'ring-2 ring-primary/40' : ''
                      )}
                      style={{
                        boxShadow: theme === 'light' ? '0 0 0 2px var(--tw-ring-color)' : undefined,
                        transition: 'background 0.3s, color 0.3s, box-shadow 0.3s',
                      }}
                    >
                      <SunIcon className="h-4 w-4 transition-colors duration-300" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                      className={cn(
                        'w-1/2 gap-2 rounded-lg transition-colors duration-300',
                        theme === 'dark'
                          ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                          : 'hover:bg-muted/60 hover:text-foreground',
                        'border border-border',
                        theme === 'dark' ? 'ring-2 ring-primary/40' : ''
                      )}
                      style={{
                        boxShadow: theme === 'dark' ? '0 0 0 2px var(--tw-ring-color)' : undefined,
                        transition: 'background 0.3s, color 0.3s, box-shadow 0.3s',
                      }}
                    >
                      <MoonIcon className="h-4 w-4 transition-colors duration-300" />
                      Dark
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>
      
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col relative">
        <textarea
          value={state.content}
          onChange={handleChange}
          onScroll={handleScroll}
          className={cn(
            "flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 lg:px-16 py-4 pb-24 resize-none bg-transparent focus:outline-none",
            "text-lg leading-relaxed whitespace-pre-wrap",
            selectedFont === 'geist' && 'font-geist',
            selectedFont === 'space' && 'font-space',
            selectedFont === 'lora' && 'font-lora',
            selectedFont === 'instrument-italic' && 'font-instrument-italic italic'
          )}
          style={{ fontSize: `${fontSize}px` }}
          placeholder="you can just type things..."
          spellCheck="true"
          autoFocus
        />
        
        {showScrollButton && (
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-16 right-4 z-40 bg-background/80 backdrop-blur-sm"
            onClick={scrollToBottom}
          >
            <ArrowDownToLine className="h-4 w-4" />
          </Button>
        )}
      </main>
      
      <StatusBar
        wordCount={wordCount}
        charCount={charCount}
        lastSaved={state.lastSaved}
        isDirty={state.isDirty}
        shortcuts={[
          { icon: <Undo2 className="h-3 w-3" />, combo: '⌘Z' },
          { icon: <Redo2 className="h-3 w-3" />, combo: '⌘Y' },
        ]}
      />
    </div>
  );
}