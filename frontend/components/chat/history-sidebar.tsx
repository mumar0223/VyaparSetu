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
  MoreHorizontal,
  AudioLines,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "./types";

interface HistorySidebarProps {
  conversations: ConversationSummary[];
  activeChatId?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onStartVoiceSession?: () => void;
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
  onStartVoiceSession,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
}: HistorySidebarProps) {

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startRename = (conv: ConversationSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
  };

  // Filter conversations by search query
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filtered.filter((c) => c.pinned);
  const recentChats = filtered.filter((c) => !c.pinned);

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-zinc-800/60 bg-[#171717] h-full transition-[width] duration-300 ease-in-out select-none overflow-hidden",
        isOpen ? "w-[260px]" : "w-0 border-l-0"
      )}
    >
      {/* Inner Fixed-Width Wrapper (Keeps layout rock-solid during width animation) */}
      <div className="w-[260px] h-full flex flex-col shrink-0">
        {/* Top Header: Perfectly Aligned H-9 Row */}
        <div className="flex h-14 items-center justify-between gap-2 px-3 border-b border-zinc-800/50">
          <button
            onClick={onNewChat}
            className="flex flex-1 h-9 items-center justify-center gap-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 px-3 text-[13px] font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer border border-zinc-700/50"
          >
            <Plus className="size-4 text-zinc-300" />
            <span>New chat</span>
          </button>

          <button
            onClick={onToggle}
            title="Close chat history"
            className="size-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer border border-transparent hover:border-zinc-700/40"
          >
            <PanelRightClose className="size-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pt-2.5 pb-1">
          <div className="flex h-9 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-2.5 text-[12.5px] text-zinc-400">
            <Search className="size-3.5 shrink-0 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-transparent focus:outline-hidden text-[12.5px] text-zinc-200 placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Gemini Live Voice Session Trigger */}
        <div className="px-3 pt-1 pb-1">
          <button
            onClick={onStartVoiceSession}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-sky-950/50 via-indigo-950/40 to-zinc-900/70 hover:from-sky-900/60 hover:to-indigo-900/50 border border-sky-500/25 hover:border-sky-500/45 text-sky-300 hover:text-sky-100 transition-all cursor-pointer shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <AudioLines className="size-4 text-sky-400 group-hover:scale-110 transition-transform animate-pulse" />
              <span className="text-[12.5px] font-medium">Voice Agent OS</span>
            </div>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Live
            </span>
          </button>
        </div>


        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-4">
          {/* Pinned Section */}
          {pinnedChats.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
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
                    onDelete={() => onDeleteChat(c.id)}
                    onTogglePin={() => onTogglePin(c.id, !c.pinned)}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Recents Section */}
          <div>
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Recents
            </div>
            {recentChats.length === 0 && pinnedChats.length === 0 ? (
              <div className="px-3 py-8 text-center text-[12.5px] text-zinc-500">
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
                    onDelete={() => onDeleteChat(c.id)}
                    onTogglePin={() => onTogglePin(c.id, !c.pinned)}
                  />
                ))}
              </ul>
            )}
          </div>
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
  onStartRename: (e?: React.MouseEvent) => void;
  onSaveRename: (e?: React.MouseEvent) => void;
  onCancelRename: (e?: React.MouseEvent) => void;
  onDelete: () => void;
  onTogglePin: () => void;
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
        <div className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 rounded-lg">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-transparent text-[13px] text-zinc-100 focus:outline-hidden"
            autoFocus
          />
          <button
            onClick={onSaveRename}
            className="size-5 rounded flex items-center justify-center text-emerald-400 hover:bg-emerald-950/50 cursor-pointer"
          >
            <Check className="size-3.5" />
          </button>
          <button
            onClick={onCancelRename}
            className="size-5 rounded flex items-center justify-center text-zinc-400 hover:bg-zinc-700 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={onSelect}
          className={cn(
            "flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-[13.5px] transition-colors cursor-pointer leading-tight",
            isActive
              ? "bg-zinc-800/90 text-zinc-100 font-normal"
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 font-normal"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <MessageSquare className="size-3.5 shrink-0 opacity-60 text-zinc-400" />
            <span className="truncate text-[13.5px]">{conversation.title}</span>
          </div>

          {/* Right Action Icons: Pin (on hover or pinned) + Dropdown Menu (...) */}
          <div
            className={cn(
              "flex items-center gap-1 shrink-0",
              isActive || conversation.pinned
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Pin Toggle (visible when pinned, or on hover) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin();
              }}
              title={conversation.pinned ? "Unpin chat" : "Pin chat"}
              className={cn(
                "size-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 cursor-pointer transition-colors",
                conversation.pinned && "text-sky-400"
              )}
            >
              <Pin className="size-3.5" />
            </button>

            {/* Shadcn Dropdown Menu for More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="size-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 cursor-pointer transition-colors outline-hidden data-popup-open:bg-zinc-700/80 data-popup-open:text-zinc-100"
              >
                <MoreHorizontal className="size-3.5" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={4}
                className="w-38 rounded-xl bg-[#212121] border border-zinc-800 p-1 text-zinc-200 shadow-2xl z-50"
              >
                <DropdownMenuItem
                  onClick={onStartRename}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] text-zinc-200 rounded-lg hover:bg-zinc-800 hover:text-white cursor-pointer"
                >
                  <Edit2 className="size-3.5 text-zinc-400" />
                  <span>Rename</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-zinc-800 my-1 -mx-1" />

                <DropdownMenuItem
                  onClick={onTogglePin}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] text-zinc-200 rounded-lg hover:bg-zinc-800 hover:text-white cursor-pointer"
                >
                  {conversation.pinned ? (
                    <>
                      <PinOff className="size-3.5 text-zinc-400" />
                      <span>Unpin chat</span>
                    </>
                  ) : (
                    <>
                      <Pin className="size-3.5 text-zinc-400" />
                      <span>Pin chat</span>
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={onDelete}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] text-rose-400 rounded-lg hover:bg-rose-950/40 hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="size-3.5 text-rose-400" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </li>
  );
}
