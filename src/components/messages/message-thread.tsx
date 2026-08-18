"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  sendMessage,
  acceptConversation,
  declineConversation,
  markConversationRead,
} from "@/app/(main)/messages/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Message, ConversationStatus } from "@/types/database.types";

type OtherUser = { id: string; username: string; display_name: string | null; avatar_url: string | null };

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function MessageThread({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
  initialStatus,
  isInitiator,
}: {
  conversationId: string;
  currentUserId: string;
  otherUser: OtherUser;
  initialMessages: Message[];
  initialStatus: ConversationStatus;
  isInitiator: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [status, setStatus] = useState(initialStatus);
  const [content, setContent] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId, messages.length]);

  useEffect(() => {
    const supabase = createClient();

    const messagesChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === newMessage.id) ? prev : [...prev, newMessage]));
        },
      )
      .subscribe();

    const presenceChannel = supabase.channel("online-users", {
      config: { presence: { key: currentUserId } },
    });
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        setIsOnline(otherUser.id in state);
      })
      .subscribe(async (subStatus) => {
        if (subStatus === "SUBSCRIBED") {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    const typingChannel = supabase
      .channel(`typing:${conversationId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.userId !== currentUserId) {
          setOtherTyping(true);
          setTimeout(() => setOtherTyping(false), 2500);
        }
      })
      .subscribe();
    broadcastRef.current = typingChannel;

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [conversationId, currentUserId, otherUser.id]);

  function handleTyping(value: string) {
    setContent(value);
    if (typingTimeoutRef.current) return;
    broadcastRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: currentUserId } });
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 1500);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setContent("");

    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    startTransition(async () => {
      const result = await sendMessage(conversationId, trimmed);
      if ("error" in result) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      } else if (status === "pending" && !isInitiator) {
        setStatus("accepted");
      }
    });
  }

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptConversation(conversationId);
      if (!("error" in result)) setStatus("accepted");
    });
  }

  function handleDecline() {
    startTransition(async () => {
      const result = await declineConversation(conversationId);
      if (!("error" in result)) {
        setStatus("declined");
        router.push("/messages");
      }
    });
  }

  const canChat = status !== "declined";

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col sm:h-[calc(100vh-5rem)]">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Avatar src={otherUser.avatar_url} name={otherUser.display_name ?? otherUser.username} size={40} />
        <div>
          <p className="text-sm font-medium text-foreground">
            {otherUser.display_name || otherUser.username}
          </p>
          <p className="text-xs text-muted-foreground">
            {isOnline ? "Online" : `@${otherUser.username}`}
          </p>
        </div>
      </div>

      {status === "pending" && !isInitiator && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-sm text-foreground">Accept this message request?</p>
          <div className="flex gap-2">
            <Button size="sm" loading={pending} onClick={handleAccept}>
              Accept
            </Button>
            <Button size="sm" variant="outline" loading={pending} onClick={handleDecline}>
              Decline
            </Button>
          </div>
        </div>
      )}

      {status === "pending" && isInitiator && (
        <p className="mt-3 rounded-xl bg-surface-muted px-4 py-2 text-xs text-muted-foreground">
          Waiting for @{otherUser.username} to accept your message request.
        </p>
      )}

      {status === "declined" && (
        <p className="mt-3 rounded-xl bg-surface-muted px-4 py-2 text-xs text-muted-foreground">
          This conversation is no longer active.
        </p>
      )}

      <div className="flex-1 overflow-y-auto py-4">
        <div className="flex flex-col gap-2">
          {messages.map((m) => {
            const isMine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
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
            );
          })}
          {otherTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-surface-muted px-4 py-2 text-sm text-muted-foreground">
                typing...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {canChat && (
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border pt-3">
          <input
            value={content}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Write a message..."
            maxLength={2000}
            className="h-11 flex-1 rounded-full border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="sm" disabled={!content.trim()}>
            Send
          </Button>
        </form>
      )}
    </div>
  );
}
