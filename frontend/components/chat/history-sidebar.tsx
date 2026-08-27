"use client";

import { useState } from "react";
import {
  MessageSquare,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "./types";

interface HistorySidebarProps {
  conversations: ConversationSummary[];
  activeChatId?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
}

export function HistorySidebar({
  conversations,
  activeChatId,
  isOpen,
  onToggle,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
}: HistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startRename = (conv: ConversationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Filter conversations by search
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filtered.filter((c) => c.pinned);
  const recentChats = filtered.filter((c) => !c.pinned);

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-sidebar-border bg-sidebar h-full transition-all duration-300 ease-in-out select-none",
        isOpen ? "w-60" : "w-0 overflow-hidden border-l-0"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-sidebar-border/40 min-w-60">
        <button
          onClick={onNewChat}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-800/80 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-700/80 hover:text-white transition-colors cursor-pointer border border-zinc-700/50"
        >
          <Plus className="size-3.5" />
          <span>New chat</span>
        </button>

        <button
          onClick={onToggle}
          title="Close sidebar"
          className="ml-2 size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
        >
          <PanelRightClose className="size-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2 min-w-60">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-xs text-muted-foreground">
          <Search className="size-3.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-transparent focus:outline-hidden text-xs text-foreground placeholder:text-muted-foreground/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 min-w-60">
        {/* Pinned Section */}
        {pinnedChats.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Pin className="size-3 text-sky-400" />
              <span>Pinned</span>
            </div>
            <ul className="flex flex-col gap-0.5">
              {pinnedChats.map((c) => (
                <ChatItem
                  key={c.id}
                  conversation={c}
                  isActive={c.id === activeChatId}
                  isEditing={editingId === c.id}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  onSelect={() => onSelectChat(c.id)}
                  onStartRename={(e) => startRename(c, e)}
                  onSaveRename={(e) => saveRename(c.id, e)}
                  onCancelRename={cancelRename}
                  onDelete={(e) => {
                    e.stopPropagation();
                    onDeleteChat(c.id);
                  }}
                  onTogglePin={(e) => {
                    e.stopPropagation();
                    onTogglePin(c.id, !c.pinned);
                  }}
                />
              ))}
            </ul>
          </div>
        )}

        {/* Recents Section */}
        <div>
          <div className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Recent
          </div>
          {recentChats.length === 0 && pinnedChats.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground/60">
              No chat history yet
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {recentChats.map((c) => (
                <ChatItem
                  key={c.id}
                  conversation={c}
                  isActive={c.id === activeChatId}
                  isEditing={editingId === c.id}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  onSelect={() => onSelectChat(c.id)}
                  onStartRename={(e) => startRename(c, e)}
                  onSaveRename={(e) => saveRename(c.id, e)}
                  onCancelRename={cancelRename}
                  onDelete={(e) => {
                    e.stopPropagation();
                    onDeleteChat(c.id);
                  }}
                  onTogglePin={(e) => {
                    e.stopPropagation();
                    onTogglePin(c.id, !c.pinned);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

interface ChatItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (val: string) => void;
  onSelect: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onSaveRename: (e: React.MouseEvent) => void;
  onCancelRename: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onTogglePin: (e: React.MouseEvent) => void;
}

function ChatItem({
  conversation,
  isActive,
  isEditing,
  editTitle,
  setEditTitle,
  onSelect,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDelete,
  onTogglePin,
}: ChatItemProps) {
  return (
    <li className="relative group">
      {isEditing ? (
        <div className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-lg">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground focus:outline-hidden"
            autoFocus
          />
          <button
            onClick={onSaveRename}
            className="size-5 rounded flex items-center justify-center text-emerald-400 hover:bg-emerald-950/50"
          >
            <Check className="size-3" />
          </button>
          <button
            onClick={onCancelRename}
            className="size-5 rounded flex items-center justify-center text-zinc-400 hover:bg-zinc-700"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={onSelect}
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer",
            isActive
              ? "bg-zinc-800 text-zinc-100 font-medium"
              : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="size-3.5 shrink-0 opacity-70" />
            <span className="truncate">{conversation.title}</span>
          </div>

          {/* Action buttons visible on hover or active */}
          <div
            className={cn(
              "flex items-center gap-0.5 shrink-0",
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            <button
              onClick={onTogglePin}
              title={conversation.pinned ? "Unpin" : "Pin"}
              className="size-5 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 cursor-pointer"
            >
              {conversation.pinned ? (
                <PinOff className="size-3" />
              ) : (
                <Pin className="size-3" />
              )}
            </button>
            <button
              onClick={onStartRename}
              title="Rename"
              className="size-5 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 cursor-pointer"
            >
              <Edit2 className="size-3" />
            </button>
            <button
              onClick={onDelete}
              title="Delete"
              className="size-5 rounded flex items-center justify-center text-zinc-400 hover:text-destructive hover:bg-destructive/20 cursor-pointer"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
