import { useEffect, useMemo, useRef, useState } from "react";
import { createClient, type RealtimeChannel, type RealtimePresenceState, type SupabaseClient } from "@supabase/supabase-js";

type RealtimeStatus = "disabled" | "connecting" | "connected" | "error";

function randomKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `u_${Math.random().toString(36).slice(2, 10)}`;
}

function presenceCount(state: RealtimePresenceState<Record<string, unknown>>): number {
  return Object.values(state).reduce((sum, entries) => sum + entries.length, 0);
}

export function useRealtimeFocusRooms(roomIds: string[], joinedRoomId: string) {
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(roomIds.map((id) => [id, 0])),
  );
  const [status, setStatus] = useState<RealtimeStatus>("disabled");

  const channelsRef = useRef<Record<string, RealtimeChannel>>({});
  const clientRef = useRef<SupabaseClient | null>(null);
  const memberKeyRef = useRef<string>(randomKey());

  const roomKey = useMemo(() => roomIds.join("|"), [roomIds]);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

  useEffect(() => {
    setRoomCounts((prev) => {
      const base = Object.fromEntries(roomIds.map((id) => [id, prev[id] ?? 0]));
      return base;
    });
  }, [roomKey, roomIds]);

  useEffect(() => {
    if (!isConfigured) {
      setStatus("disabled");
      return;
    }
    setStatus("connecting");

    if (!supabaseUrl || !supabaseAnonKey) {
      setStatus("disabled");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    clientRef.current = supabase;

    let subscribedChannels = 0;

    roomIds.forEach((roomId) => {
      const channel = supabase.channel(`focus-room-${roomId}`, {
        config: {
          presence: {
            key: memberKeyRef.current,
          },
        },
      });

      channel.on("presence", { event: "sync" }, () => {
        setRoomCounts((prev) => ({
          ...prev,
          [roomId]: presenceCount(channel.presenceState()),
        }));
      });

      channel.subscribe((channelStatus) => {
        if (channelStatus === "SUBSCRIBED") {
          subscribedChannels += 1;
          if (subscribedChannels >= roomIds.length) {
            setStatus("connected");
          }
          if (roomId === joinedRoomId) {
            void channel.track({ online_at: new Date().toISOString() });
          }
        }
        if (channelStatus === "CHANNEL_ERROR" || channelStatus === "TIMED_OUT") {
          setStatus("error");
        }
      });

      channelsRef.current[roomId] = channel;
    });

    return () => {
      const channels = Object.values(channelsRef.current);
      channels.forEach((channel) => {
        void channel.untrack();
      });
      channels.forEach((channel) => {
        void supabase.removeChannel(channel);
      });
      channelsRef.current = {};
      clientRef.current = null;
    };
  }, [isConfigured, roomKey, supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    if (!isConfigured) return;
    Object.entries(channelsRef.current).forEach(([roomId, channel]) => {
      if (roomId === joinedRoomId) {
        void channel.track({ online_at: new Date().toISOString() });
      } else {
        void channel.untrack();
      }
    });
  }, [joinedRoomId, isConfigured]);

  return {
    roomCounts,
    realtimeStatus: status,
    realtimeEnabled: isConfigured && status === "connected",
    realtimeConfigured: isConfigured,
  };
}
