import { useState } from 'react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Plus, Trash2 } from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { useEntries, Entry } from '@/contexts/EntryContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

function getContentPreview(content: string): string {
  if (!content) return 'Empty entry...';
  const firstLine = content.split('\n').find(line => line.trim()) || '';
  return firstLine.trim().slice(0, 50) + (firstLine.length > 50 ? '...' : '');
}

export function Sidebar({ isOpen, onClose, className }: SidebarProps) {
  const { entries, currentEntry, setCurrentEntry, createNewEntry, deleteEntry } = useEntries();
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleEntryClick = (entry: Entry) => {
    if (currentEntry?.id === entry.id) return;
    setCurrentEntry(entry);
  };

  const handleNewEntry = () => {
    createNewEntry();
  };

  const handleDeleteClick = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteEntryId(entryId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteEntryId) {
      deleteEntry(deleteEntryId);
    }
    setIsDeleteModalOpen(false);
    setDeleteEntryId(null);
  };

  const entryToDelete = entries.find(entry => entry.id === deleteEntryId);

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          "lg:hidden"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-background border-r border-border/10",
          "transform transition-transform duration-300 ease-in-out z-50",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="h-12 px-4 flex items-center justify-between border-b border-border/10">
          <h2 className="text-sm font-medium">Entries</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleNewEntry}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="py-4 px-2 space-y-1">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2">No entries yet</p>
          ) : (
            entries.map((entry) => {
              const entryDate = new Date(entry.date);
              const isSelected = entry.id === currentEntry?.id;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "w-full p-2 rounded-md cursor-pointer group",
                    isSelected ? "bg-primary/10" : "hover:bg-primary/10 hover:text-primary",
                    "transition-colors"
                  )}
                  onClick={() => handleEntryClick(entry)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm flex items-center gap-2">
                        <span className="truncate">{format(entryDate, 'MMM dd, yyyy')}</span>
                        {isToday(entryDate) && (
                          <span className="flex-shrink-0 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Today</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {getContentPreview(entry.content)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteClick(entry.id, e)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          entryTitle={format(new Date(entryToDelete.date), 'MMMM d, yyyy')}
        />
      )}
    </>
  );
} 