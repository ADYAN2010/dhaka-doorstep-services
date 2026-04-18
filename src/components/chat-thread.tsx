import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";

type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  read_at: string | null;
  created_at: string;
};

type ParticipantInfo = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Props = {
  threadId: string;
  customerId: string;
  providerId: string;
  participants: Record<string, ParticipantInfo>;
  className?: string;
};

const TYPING_TIMEOUT_MS = 2500;

export function ChatThread({
  threadId,
  customerId,
  providerId,
  participants,
  className = "",
}: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ url: string; path: string } | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentAt = useRef(0);

  const isAdmin = user && user.id !== customerId && user.id !== providerId;

  const otherId = useMemo(() => {
    if (!user) return null;
    if (user.id === customerId) return providerId;
    if (user.id === providerId) return customerId;
    return null; // admin
  }, [user, customerId, providerId]);

  // Initial load + mark read
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, thread_id, sender_id, body, image_url, read_at, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        toast.error(error.message);
        setMessages([]);
        return;
      }
      setMessages(data as Message[]);
    })();

    if (user && !isAdmin) {
      void supabase.rpc("mark_thread_read", { _thread_id: threadId });
    }

    return () => {
      cancelled = true;
    };
  }, [threadId, user, isAdmin]);

  // Realtime new messages
  useEffect(() => {
    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => {
            if (!prev) return [m];
            if (prev.some((x) => x.id === m.id)) return prev;
            return [...prev, m];
          });
          // If incoming from the other side, mark read.
          if (user && !isAdmin && m.sender_id !== user.id) {
            void supabase.rpc("mark_thread_read", { _thread_id: threadId });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, user, isAdmin]);

  // Typing presence channel (broadcast)
  useEffect(() => {
    if (!user || isAdmin) return;
    const ch = supabase.channel(`typing-${threadId}`, {
      config: { broadcast: { self: false } },
    });
    ch.on("broadcast", { event: "typing" }, (payload) => {
      if (payload.payload?.userId && payload.payload.userId !== user.id) {
        setOtherTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(
          () => setOtherTyping(false),
          TYPING_TIMEOUT_MS,
        );
      }
    });
    ch.subscribe();
    presenceChannelRef.current = ch;
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(ch);
      presenceChannelRef.current = null;
    };
  }, [threadId, user, isAdmin]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, otherTyping]);

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only images allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${threadId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("chat-attachments")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("chat-attachments").getPublicUrl(path);
    setPendingImage({ url: pub.publicUrl, path });
    setUploading(false);
  }

  async function send() {
    if (!user || isAdmin) return;
    const body = input.trim();
    if (!body && !pendingImage) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      thread_id: threadId,
      sender_id: user.id,
      body: body || null,
      image_url: pendingImage?.url ?? null,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setInput("");
    setPendingImage(null);
  }

  function emitTyping() {
    if (!user || !presenceChannelRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentAt.current < 1500) return;
    lastTypingSentAt.current = now;
    void presenceChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id },
    });
  }

  function nameOf(senderId: string) {
    return participants[senderId]?.full_name || "Someone";
  }

  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card ${className}`}>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages === null ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            No messages yet — say hello to get things moving.
          </div>
        ) : (
          messages.map((m) => {
            const mine = user?.id === m.sender_id;
            const senderInfo = participants[m.sender_id];
            return (
              <div
                key={m.id}
                className={`flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                  {senderInfo?.avatar_url ? (
                    <img src={senderInfo.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    nameOf(m.sender_id).slice(0, 1).toUpperCase()
                  )}
                </span>
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-soft ${
                    mine
                      ? "rounded-br-sm bg-gradient-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  }`}
                >
                  {m.image_url && (
                    <img
                      src={m.image_url}
                      alt="Attachment"
                      className="mb-1 max-h-60 w-full rounded-lg object-cover"
                    />
                  )}
                  {m.body && <div className="whitespace-pre-wrap break-words">{m.body}</div>}
                  <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {mine && m.read_at ? " · Read" : ""}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {otherTyping && otherId && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex gap-0.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:240ms]" />
            </span>
            {nameOf(otherId)} is typing…
          </div>
        )}
      </div>

      {isAdmin ? (
        <div className="border-t border-border bg-muted px-4 py-3 text-center text-xs text-muted-foreground">
          Read-only · viewing as admin
        </div>
      ) : (
        <div className="border-t border-border bg-background p-3">
          {pendingImage && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted p-2">
              <img src={pendingImage.url} alt="" className="h-12 w-12 rounded object-cover" />
              <span className="flex-1 truncate text-xs text-muted-foreground">Image attached</span>
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-background"
                aria-label="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <label className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImagePick}
                disabled={uploading}
              />
            </label>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                emitTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Type a message…"
              rows={1}
              className="min-h-10 max-h-32 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || (!input.trim() && !pendingImage)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft disabled:opacity-50"
              aria-label="Send"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
