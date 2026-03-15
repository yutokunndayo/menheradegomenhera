import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import GeminiProvider, { useGemini } from "../components/api";
import TabBar from "../components/TabBar";
import AppHeader from "../components/AppHeader";
import { FiSend, FiUser } from "react-icons/fi";
import bandageImage from "../assets/bandage.png";
import chatHeartImage from "../assets/chat-heart.png";
import "../styles/Chat.css";

interface Message {
    id: string;
    sender: string;
    text: string;
    time: string;
    isMe: boolean;
}

type MyGender = "boyfriend" | "girlfriend";

const GENDER_THEME: Record<MyGender, {
    myBubbleClass: string;
    partnerBubbleClass: string;
    myDecoImage: string | null;
    partnerDecoImage: string | null;
    myDecoClass: string;
    partnerDecoClass: string;
}> = {
    boyfriend: {
        myBubbleClass: "bubble-me-boyfriend",
        partnerBubbleClass: "bubble-partner-girlfriend",
        myDecoImage: chatHeartImage,
        myDecoClass: "deco-bottom-right",
        partnerDecoImage: bandageImage,
        partnerDecoClass: "deco-top-right",
    },
    girlfriend: {
        myBubbleClass: "bubble-me-girlfriend",
        partnerBubbleClass: "bubble-partner-boyfriend",
        myDecoImage: bandageImage,
        myDecoClass: "deco-top-right",
        partnerDecoImage: chatHeartImage,
        partnerDecoClass: "deco-bottom-right",
    },
};

function rowToMessage(row: Record<string, string>, myId: string): Message {
    const d = new Date(row.send_at);
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return {
        id: String(row.uid),
        sender: row.sender,
        text: row.text,
        time,
        isMe: row.sender === myId,
    };
}

function ChatInner() {
    const { generateChatResponse } = useGemini();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [partnerName, setPartnerName] = useState("パートナー");
    const [partnerIcon, setPartnerIcon] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [myGender, setMyGender] = useState<MyGender>("boyfriend");
    const [myId, setMyId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const myGenderRef = useRef<MyGender>("boyfriend");
    const partnerIdRef = useRef<string | null>(null);
    const myIdRef = useRef<string | null>(null);
    const messagesRef = useRef<Message[]>([]);
    const initializedRef = useRef(false); // 二重初期化防止

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const generateAndSaveAdvice = useCallback(async (
        currentMessages: Message[],
        myUserId: string,
    ) => {
        try {
            const recentMessages = currentMessages.slice(-10);
            if (recentMessages.length === 0) return;

            const conversationText = recentMessages
                .map((m) => `${m.isMe ? "彼女" : "彼氏"}: ${m.text}`)
                .join("\n");

            const prompt = `あなたは夜の街で数多の「メンヘラ女子」を対応し、幾度もの修羅場から生還してきた伝説のプロ黒服であり、今は恋愛の真理に到達した「黒服の仙人」です。
以下は、あなたに教えを乞う彼氏（坊主）と、その彼女のチャット履歴です。彼女の言葉の裏にある「地雷」や「本音」を的確に見抜き、彼氏がどう返信すれば丸く収まるか、あるいは惚れ直させることができるかを指南してください。

【条件】
・「〜じゃ」「〜するんじゃな」「坊主」といった、渋くて達観した仙人口調で話すこと。
・例文の時は普通のキャラに戻ること
・バナーに表示するため、絶対に1〜2文の短いアドバイスにまとめること。
・前置きや挨拶は一切不要。アドバイスの言葉のみを出力すること。
・雑な返信にならないようなるべく7W1Hを意識して、具体的に返信内容を示すこと。
・好きや愛してるなどの相手を肯定する言葉を必ず入れること。
・会話がなるべく終わらないように、返信内容に質問を入れること。
・会話が終わるタイミングはとくに見極めること。
・彼女の言葉の裏にある「地雷」や「本音」を的確に見抜き、彼氏がどう返信すれば丸く収まるか、あるいは惚れ直させることができるかを指南すること。
・
チャット履歴:
${conversationText}`;

            const adviceText = await generateChatResponse(prompt);
            if (!adviceText || adviceText.trim() === "") return;

            const { error } = await supabase
                .from("chat_emotion_contexts")
                .insert({
                    user_id: myUserId,
                    emotion_text: adviceText.trim(),
                });

            if (error) {
                console.error("[Advice] INSERTエラー:", error.code, error.message);
                return;
            }
            console.log("[Advice] DB保存成功!");

        } catch (e) {
            console.error("[Advice] 予期せぬエラー:", e);
        }
    }, [generateChatResponse]);

    useEffect(() => {
        let isMounted = true;

        const init = async (userId: string) => {
            // 二重初期化を防ぐ
            if (initializedRef.current) return;
            initializedRef.current = true;

            setMyId(userId);
            myIdRef.current = userId;

            const { data: myProfile, error: profileError } = await supabase
                .from("profiles")
                .select("name, gender, partner, avatar")
                .eq("id", userId)
                .maybeSingle();

            if (profileError) {
                console.error("[Chat] profiles取得エラー:", profileError.message);
                initializedRef.current = false;
                return;
            }
            if (!myProfile || !isMounted) return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const genderRaw = (myProfile as any).gender;
            const gender: MyGender = (genderRaw === true || genderRaw === "true") ? "girlfriend" : "boyfriend";
            setMyGender(gender);
            myGenderRef.current = gender;

            const pId: string | null = myProfile.partner ?? null;
            if (!pId) return;
            partnerIdRef.current = pId;

            const { data: partnerProfile } = await supabase
                .from("profiles")
                .select("name, avatar")
                .eq("id", pId)
                .maybeSingle();

            if (partnerProfile) {
                setPartnerName(partnerProfile.name ?? "パートナー");
                if (partnerProfile.avatar) {
                    const { data: urlData } = supabase.storage
                        .from("avatars")
                        .getPublicUrl(partnerProfile.avatar);
                    setPartnerIcon(urlData.publicUrl);
                }
            }

            const { data: rows } = await supabase
                .from("messages")
                .select("uid, sender, text, send_at")
                .eq("is_memory", false)
                .in("sender", [userId, pId])
                .order("send_at", { ascending: true })
                .limit(100);

            if (rows && isMounted) {
                setMessages(rows.map(r => rowToMessage(r, userId)));
            }

            // リアルタイム購読 — 既存チャンネルがあれば先に削除
            if (channelRef.current) {
                await supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }

            const channelName = `chat-${[userId, pId].sort().join("-")}`;
            channelRef.current = supabase
                .channel(channelName)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages",
                        filter: `sender=eq.${pId}`,
                    },
                    (payload) => {
                        if (!isMounted) return;
                        const newMsg = rowToMessage(
                            payload.new as Record<string, string>,
                            userId
                        );
                        setMessages(prev => {
                            if (prev.find(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                    }
                )
                .subscribe((status) => {
                    console.log("[Chat] Realtime status:", status);
                });
        };

        // getSession で即時取得を優先、なければ onAuthStateChange で待つ
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user && isMounted) {
                init(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async ( _event, session) => {
                if (session?.user && isMounted && !initializedRef.current) {
                    await init(session.user.id);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    const handleSend = async () => {
        const text = input.trim();
        const currentMyId = myId;
        if (!text || !currentMyId || sending) return;

        setSending(true);
        setInput("");

        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: Message = {
            id: tempId,
            sender: currentMyId,
            text,
            time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
            isMe: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const { data, error } = await supabase.from("messages").insert({
            sender: currentMyId,
            text,
            send_at: new Date().toISOString(),
            is_memory: false,
        }).select("uid, sender, text, send_at").single();

        setSending(false);

        if (error) {
            console.error("送信エラー:", error.message);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setInput(text);
            return;
        }

        if (data) {
            setMessages(prev =>
                prev.map(m => m.id === tempId ? rowToMessage(data, currentMyId) : m)
            );
        }

        // 彼女（gender=true）のみ: 自分のIDでアドバイスをDBに保存
        if (myGenderRef.current === "girlfriend" && myIdRef.current) {
            const latestMessages = [
                ...messagesRef.current.filter(m => m.id !== tempId),
                data ? rowToMessage(data, currentMyId) : optimisticMsg,
            ];
            generateAndSaveAdvice(latestMessages, myIdRef.current);
        }
    };

    const theme = GENDER_THEME[myGender];

    return (
        <div className="chat-wrapper">
            <AppHeader variant="chat" name={partnerName} icon={partnerIcon} />

            <div className="chat-messages">
                {messages.map((msg, i) => {
                    const isPartner = !msg.isMe;
                    const showIcon = isPartner && (i === 0 || messages[i - 1].isMe);
                    const bubbleClass = isPartner ? theme.partnerBubbleClass : theme.myBubbleClass;
                    const decoImage = isPartner ? theme.partnerDecoImage : theme.myDecoImage;
                    const decoClass = isPartner ? theme.partnerDecoClass : theme.myDecoClass;

                    return (
                        <div key={msg.id} className={`chat-row ${isPartner ? "row-partner" : "row-me"}`}>
                            {isPartner && (
                                <div className="chat-row-icon">
                                    {showIcon && (
                                        partnerIcon ? (
                                            <img src={partnerIcon} alt="" className="bubble-partner-img" />
                                        ) : (
                                            <div className="bubble-partner-placeholder">
                                                <FiUser size={16} color="white" strokeWidth={2} />
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                            <div className="chat-bubble-wrap">
                                <div className={`chat-bubble ${bubbleClass}`}>
                                    {msg.text.split("\n").map((line, j, arr) => (
                                        <span key={j}>
                                            {line}
                                            {j < arr.length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>
                                {decoImage && (
                                    <img src={decoImage} alt="" className={`bubble-deco ${decoClass}`} />
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <div className="chat-input-bar">
                <input
                    className="chat-input"
                    type="text"
                    placeholder="メッセージを入力"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                <button
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    aria-label="送信"
                >
                    <FiSend size={18} color="white" strokeWidth={2} />
                </button>
            </div>

            {!isFocused && <TabBar />}
        </div>
    );
}

function Chat() {
    return (
        <GeminiProvider>
            <ChatInner />
        </GeminiProvider>
    );
}

export default Chat;
