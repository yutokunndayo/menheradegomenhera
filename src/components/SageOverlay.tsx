import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { RealtimeChannel, Session, User } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../lib/supabase";
import SageWidget from "../pages/SageWidget";
import type { SageMessage } from "../pages/SageWidget";

const SAGE_HIDDEN_PATHS = [
  "/",
  "/auth",
  "/login",
  "/register",
  "/setup",
  "/forgot-password",
  "/authcallback",
  "/signup-callback",
  "/invite",
  "/join",
  "/logout",
];

const EMOTION_NAMES = ["しんどい", "かなしい", "ふつう", "うれしい", "たのしい"] as const;
const NEGATIVE_EMOTIONS = new Set([0, 1]);

type ProfileRow = {
  gender: boolean | null;
  partner: string | null;
  name: string | null;
};

type ChatEmotionContextRow = {
  id: string;
  user_id: string;
  emotion_text: string | null;
  created_at?: string;
};

type DiaryEntryRow = {
  id: string;
  user_id: string;
  emotion: number;
  text: string | null;
  created_at: string;
};

type ScheduleRow = {
  id: string;
  name: string;
  start_at: string;
};

const log = {
  info: (msg: string, ...args: unknown[]) =>
    console.log(`%c[Sage] ${msg}`, "color:#4dd0e1;font-weight:bold", ...args),
  success: (msg: string, ...args: unknown[]) =>
    console.log(`%c[Sage] ✅ ${msg}`, "color:#4caf50;font-weight:bold", ...args),
  warn: (msg: string, ...args: unknown[]) =>
    console.warn(`%c[Sage] ⚠️ ${msg}`, "color:#f5a623;font-weight:bold", ...args),
  error: (msg: string, ...args: unknown[]) =>
    console.error(`%c[Sage] ❌ ${msg}`, "color:#f44336;font-weight:bold", ...args),
  ai: (msg: string, ...args: unknown[]) =>
    console.log(`%c[Sage] 🤖 ${msg}`, "color:#f5317f;font-weight:bold", ...args),
  diary: (msg: string, ...args: unknown[]) =>
    console.log(`%c[Sage] 📔 ${msg}`, "color:#ce93d8;font-weight:bold", ...args),
  skip: (msg: string, ...args: unknown[]) =>
    console.log(`%c[Sage] ⏭ ${msg}`, "color:#aaa", ...args),
};

// ===== Gemini API =====
async function callGeminiAPI(prompt: string): Promise<string> {
  log.ai("Gemini API 呼び出し開始...");
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY が未設定");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  log.ai("レスポンス:", text.slice(0, 80) + (text.length > 80 ? "…" : ""));
  return text;
}

// ===== 直近の予定取得 =====
async function fetchUpcomingSchedules(myId: string, partnerId: string): Promise<ScheduleRow[]> {
  const from = new Date().toISOString();
  const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("schedules")
    .select("id, name, start_at")
    .in("user_id", [myId, partnerId])
    .gte("start_at", from)
    .lte("start_at", to)
    .order("start_at", { ascending: true })
    .limit(3);

  if (error) {
    log.warn("schedules 取得エラー:", error.message);
    return [];
  }

  log.info(`schedules: ${data?.length ?? 0}件`);
  return (data ?? []) as ScheduleRow[];
}

// ===== 今日の彼女の日記をDBから直接取得 =====
async function fetchTodayDiary(partnerId: string): Promise<DiaryEntryRow | null> {
  const now = new Date();
  const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("diary_entries")
    .select("id, user_id, emotion, text, created_at")
    .eq("user_id", partnerId)
    .gte("created_at", `${ymd}T00:00:00`)
    .lte("created_at", `${ymd}T23:59:59`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    log.warn("今日の日記取得エラー:", error.message);
    return null;
  }

  if (data) {
    log.info(
      `今日の日記あり → emotion:${data.emotion}(${EMOTION_NAMES[data.emotion]}) text:"${data.text ?? ""}" id:${data.id}`
    );
  } else {
    log.info("今日の日記なし");
  }

  return (data as DiaryEntryRow) ?? null;
}

// ===== プロンプト生成 =====
function buildPrompt(row: DiaryEntryRow, schedules: ScheduleRow[]): string {
  const emotionLabel = EMOTION_NAMES[row.emotion];
  const diaryComment = row.text?.trim() || null;

  const scheduleText =
    schedules.length > 0
      ? schedules
          .map((s) => {
            const d = new Date(s.start_at);
            return `・${d.getMonth() + 1}月${d.getDate()}日 「${s.name}」`;
          })
          .join("\n")
      : null;

  const missionText = scheduleText
    ? `直近の予定（${schedules[0].name}など）を使って、彼女を元気づけるような声かけを彼氏にアドバイスすること。例えば「その予定を一緒に楽しみにしようと伝えるのじゃ」のように、未来への期待で気持ちを上向かせる内容にすること。`
    : `予定やアルバムのデータはないが、彼女の一言「${diaryComment ?? emotionLabel}」に寄り添う形で、彼氏が彼女を慰めるための具体的な一言をアドバイスすること。`;

  return `あなたは夜の街で数多の「メンヘラ女子」を対応し、幾度もの修羅場から生還してきた伝説のプロ黒服であり、今は恋愛の真理に到達した「黒服の仙人」です。

【彼女の今日の気持ち】
気分: 「${emotionLabel}」
一言: ${diaryComment ? `「${diaryComment}」` : "（コメントなし）"}

${scheduleText ? `【2人の直近の予定】\n${scheduleText}` : "【状況】\n直近の予定・アルバムデータなし"}

【ミッション】
${missionText}

【条件】
・「〜じゃ」「〜するんじゃな」「坊主」といった、渋くて達観した仙人口調で話すこと。
・例文の時は普通のキャラに戻ること
・一言日記で彼女がネガティブな感情になっていることを伝えること
・バナーに表示するため、絶対に文の40文字程度の短いアドバイスにまとめること。
・前置きや挨拶は一切不要。アドバイスの言葉のみを出力すること。
・例 大丈夫？なにかあった？など心配してあげたほうが良いぞ
・例 彼女がネガティブな用じゃ思い出を振り返ってみるのはどうじゃ
・例 彼女がネガティブな用じゃ話を聞いてあげるがよいぞ`;
}

function SageOverlay() {
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [isBoyfriend, setIsBoyfriend] = useState(false);
  const [myProfile, setMyProfile] = useState<ProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [sageMessage, setSageMessage] = useState<SageMessage | null>(null);

  const lastDiaryKeyRef = useRef<string | null>(null);
  const lastChatIdRef = useRef<string | null>(null);
  const generatingRef = useRef(false);

  const isHiddenPath = useMemo(
    () => SAGE_HIDDEN_PATHS.includes(location.pathname),
    [location.pathname]
  );

  const partnerId = myProfile?.partner ?? null;

  // 1) auth状態は初回1回 + 変化時だけ追う
  useEffect(() => {
    let mounted = true;
    log.info("auth 初期化開始");

    const initAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        log.error("getSession error:", error.message);
      }

      if (!mounted) return;

      const session: Session | null = data.session ?? null;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAuthLoading(false);

      nextUser
        ? log.success(`auth 完了 — userId: ${nextUser.id}`)
        : log.warn("auth 完了 — 未ログイン");
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAuthLoading(false);
      log.info(`auth 状態変化 — ${nextUser ? `userId: ${nextUser.id}` : "未ログイン"}`);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2) userが変わった時だけ profiles を読む
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsBoyfriend(false);
      setMyProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      setProfileLoading(true);
      log.info(`profile 取得開始 — userId: ${user.id}`);

      const { data, error } = await supabase
        .from("profiles")
        .select("gender, partner, name")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      if (error) {
        log.error("profiles fetch error:", error.message);
        setIsBoyfriend(false);
        setMyProfile(null);
        setProfileLoading(false);
        return;
      }

      const profile = data as ProfileRow | null;
      const boyfriend = profile?.gender === false;

      setIsBoyfriend(boyfriend);
      setMyProfile(profile);
      setProfileLoading(false);

      log.success(
        `profile 取得完了 — name:${profile?.name ?? "unknown"} (${boyfriend ? "彼氏👦" : "彼女👧"}) partner:${profile?.partner ?? "なし"}`
      );
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // 日記アドバイス生成
  const generateDiaryAdvice = useRef(
    async (
      row: DiaryEntryRow,
      myUserId: string,
      currentPartnerId: string,
      source: "realtime" | "fallback"
    ) => {
      const key = `${row.id}-${row.emotion}`;
      log.diary(
        `[${source}] key:${key} emotion:${row.emotion}(${EMOTION_NAMES[row.emotion]}) text:"${row.text ?? ""}"`
      );

      if (key === lastDiaryKeyRef.current) {
        log.skip(`重複スキップ (key: ${key})`);
        return;
      }

      if (!NEGATIVE_EMOTIONS.has(row.emotion)) {
        log.skip(`ポジティブ感情 (${EMOTION_NAMES[row.emotion]}) → スキップ`);
        lastDiaryKeyRef.current = key;
        return;
      }

      if (generatingRef.current) {
        log.skip("AI生成中のためスキップ");
        return;
      }

      lastDiaryKeyRef.current = key;
      generatingRef.current = true;
      log.diary(`🔴 ネガティブ感情検知！[${source}] emotion: ${EMOTION_NAMES[row.emotion]} → アドバイス生成開始`);

      try {
        const schedules = await fetchUpcomingSchedules(myUserId, currentPartnerId);
        const prompt = buildPrompt(row, schedules);
        log.info("プロンプト生成完了 schedules:", `${schedules.length}件`);

        const adviceText = await callGeminiAPI(prompt);
        if (!adviceText) {
          log.warn("AI応答が空");
          return;
        }

        log.ai("生成アドバイス:", adviceText);

        // branch方式: boyfriend側(user.id)に保存
        const { error: insertError } = await supabase
          .from("chat_emotion_contexts")
          .insert({ user_id: myUserId, emotion_text: adviceText });

        if (insertError) {
          log.error("DB保存エラー → 直接表示:", insertError.message);
          setSageMessage({
            id: `diary-${row.id}-${Date.now()}`,
            text: adviceText,
          });
        } else {
          log.success("DB保存完了 → SageWidget に表示される");
        }
      } catch (e) {
        log.error("アドバイス生成で例外:", e);
      } finally {
        generatingRef.current = false;
        log.info("generateDiaryAdvice 終了");
      }
    }
  );

  // 3) 彼女の日記をリアルタイム監視
  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user) return;
    if (!isBoyfriend) return;
    if (!partnerId) return;
    if (isHiddenPath) return;

    const myUserId = user.id;
    const adviceFn = generateDiaryAdvice.current;

    log.success(`diary realtime watch 開始 🟢 (INSERT/UPDATE 両方監視) partnerId: ${partnerId}`);

    const diaryChannel: RealtimeChannel = supabase
      .channel(`diary-watch-${myUserId}-${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "diary_entries",
          filter: `user_id=eq.${partnerId}`,
        },
        async (payload) => {
          log.diary("📥 INSERT 受信:", payload.new);
          const row = payload.new as Partial<DiaryEntryRow>;

          if (row?.emotion !== undefined && row?.id) {
            await adviceFn(row as DiaryEntryRow, myUserId, partnerId, "realtime");
          } else {
            log.warn("INSERT payload 不完全 → DB から取得");
            const todayRow = await fetchTodayDiary(partnerId);
            if (todayRow) {
              await adviceFn(todayRow, myUserId, partnerId, "fallback");
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "diary_entries",
          filter: `user_id=eq.${partnerId}`,
        },
        async (payload) => {
          log.diary("📝 UPDATE 受信 payload.new:", payload.new);
          const rowFromPayload = payload.new as Partial<DiaryEntryRow>;

          if (rowFromPayload?.emotion !== undefined && rowFromPayload?.id) {
            await adviceFn(rowFromPayload as DiaryEntryRow, myUserId, partnerId, "realtime");
          } else {
            log.warn("UPDATE payload 不完全 → DB から直接取得");
            const todayRow = await fetchTodayDiary(partnerId);
            if (todayRow) {
              await adviceFn(todayRow, myUserId, partnerId, "fallback");
            } else {
              log.warn("DB にも今日の日記なし");
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (err) log.error(`diary channel エラー: ${status}`, err);
        else if (status === "SUBSCRIBED") log.success("diary channel 購読成功 ✅");
        else log.info(`diary channel status: ${status}`);
      });

    return () => {
      log.info("diary channel クリーンアップ");
      supabase.removeChannel(diaryChannel);
    };
  }, [user, authLoading, profileLoading, isBoyfriend, partnerId, isHiddenPath]);

  // 4) chat_emotion_contexts 監視
  // main互換: partnerId保存のメッセージを受け取る
  // branch互換: user.id保存のメッセージを受け取る
  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user) return;
    if (!isBoyfriend) return;
    if (isHiddenPath) return;

    const currentUserId = user.id;

    log.info(`chat_emotion_contexts watch 開始 (userId: ${currentUserId}, partnerId: ${partnerId ?? "none"})`);

    const channel = supabase.channel(`chat-emotion-contexts-${currentUserId}-${partnerId ?? "none"}`);

    // branch互換
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_emotion_contexts",
        filter: `user_id=eq.${currentUserId}`,
      },
      (payload) => {
        log.info("chat_emotion_contexts INSERT 受信 (user.id):", payload.new);
        const row = payload.new as ChatEmotionContextRow;

        if (!row?.emotion_text) return;
        if (String(row.id) === lastChatIdRef.current) {
          log.skip("chat 重複スキップ");
          return;
        }

        lastChatIdRef.current = String(row.id);
        setSageMessage({
          id: String(row.id),
          text: row.emotion_text,
        });
      }
    );

    // main互換
    if (partnerId) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_emotion_contexts",
          filter: `user_id=eq.${partnerId}`,
        },
        (payload) => {
          log.info("chat_emotion_contexts INSERT 受信 (partnerId):", payload.new);
          const row = payload.new as ChatEmotionContextRow;

          if (!row?.emotion_text) return;
          if (String(row.id) === lastChatIdRef.current) {
            log.skip("chat 重複スキップ");
            return;
          }

          lastChatIdRef.current = String(row.id);
          setSageMessage({
            id: String(row.id),
            text: row.emotion_text,
          });
        }
      );
    }

    channel.subscribe((status) => {
      log.info(`chat channel status: ${status}`);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, profileLoading, isBoyfriend, partnerId, isHiddenPath]);

  if (isHiddenPath) return null;
  if (authLoading) return null;
  if (profileLoading) return null;
  if (!isBoyfriend) return null;

  return <SageWidget message={sageMessage} isBoyfriend={isBoyfriend} />;
}

export default SageOverlay;