"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, UserPlus, LogOut, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendGroupMessage, addGroupMember, leaveGroup } from "@/app/(main)/messages/group-actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDismissableMenu } from "@/lib/hooks/use-dismissable-menu";
import { cn } from "@/lib/utils";
import type { GroupMessage, GroupConversation } from "@/types/database.types";

type Member = { id: string; username: string; displayName: string | null; avatarUrl: string | null; role: string };
type Friend = { id: string; username: string; display_name: string | null; avatar_url: string | null };

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function groupTitle(group: GroupConversation, members: Member[], currentUserId: string) {
  if (group.name) return group.name;
  const others = members.filter((m) => m.id !== currentUserId);
  const names = others.map((m) => m.displayName || m.username);
  return names.length > 0 ? names.join(", ") : "Group";
}

export function GroupMessageThread({
  groupId,
  currentUserId,
  group,
  members,
  isOwner,
  initialMessages,
  addableFriends,
}: {
  groupId: string;
  currentUserId: string;
  group: GroupConversation;
  members: Member[];
  isOwner: boolean;
  initialMessages: GroupMessage[];
  addableFriends: Friend[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useDismissableMenu<HTMLDivElement>(menuOpen, setMenuOpen, triggerRef);

  const memberById = new Map(members.map((m) => [m.id, m]));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`group-messages:${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          const newMessage = payload.new as GroupMessage;
          setMessages((prev) => (prev.some((m) => m.id === newMessage.id) ? prev : [...prev, newMessage]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setContent("");

    const optimistic: GroupMessage = {
      id: `optimistic-${Date.now()}`,
      group_id: groupId,
      sender_id: currentUserId,
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    startTransition(async () => {
      const result = await sendGroupMessage(groupId, trimmed);
      if ("error" in result) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      } else if (result.message) {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? result.message! : m)));
      }
    });
  }

  function handleAddMember(friendId: string) {
    startTransition(async () => {
      await addGroupMember(groupId, friendId);
      router.refresh();
    });
    setAddOpen(false);
    setMenuOpen(false);
  }

  function handleLeave() {
    if (!window.confirm("Leave this group? You'll need to be added back to rejoin.")) return;
    startTransition(async () => {
      const result = await leaveGroup(groupId);
      if (!("error" in result)) router.push("/messages");
    });
  }

  const title = groupTitle(group, members, currentUserId);

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col sm:h-[calc(100dvh-6.5rem)]">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
            <Users className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{members.length} members</p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted"
            aria-label="Group options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="animate-fade-in absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
            >
              {isOwner && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setAddOpen((v) => !v)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-muted"
                >
                  <UserPlus className="size-4" />
                  Add member
                </button>
              )}
              {addOpen && (
                <div className="max-h-56 overflow-y-auto border-t border-border py-1">
                  {addableFriends.length === 0 ? (
                    <p className="px-4 py-2 text-xs text-muted-foreground">
                      No one left to add — invite people you follow each other with.
                    </p>
                  ) : (
                    addableFriends.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        role="menuitem"
                        onClick={() => handleAddMember(f.id)}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
                      >
                        <Avatar src={f.avatar_url} name={f.display_name ?? f.username} size={24} />
                        <span className="truncate">{f.display_name || f.username}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={handleLeave}
                className="flex w-full items-center gap-2.5 border-t border-border px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-muted"
              >
                <LogOut className="size-4" />
                Leave group
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="flex flex-col gap-2">
          {messages.map((m) => {
            const isMine = m.sender_id === currentUserId;
            const sender = memberById.get(m.sender_id);
            return (
              <div key={m.id} className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
                {!isMine && sender && (
                  <Link href={`/${sender.username}`} className="shrink-0 self-end">
                    <Avatar src={sender.avatarUrl} name={sender.displayName ?? sender.username} size={28} />
                  </Link>
                )}
                <div className={cn("flex max-w-[75%] flex-col", isMine ? "items-end" : "items-start")}>
                  {!isMine && sender && (
                    <span className="mb-0.5 px-1 text-xs text-muted-foreground">
                      {sender.displayName || sender.username}
                    </span>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm",
                      isMine ? "bg-primary text-primary-foreground" : "bg-surface-muted text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-[10px]",
                        isMine ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {timeLabel(m.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border pt-3">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a message..."
          maxLength={2000}
          className="h-11 flex-1 rounded-full border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="sm" loading={pending} disabled={!content.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
