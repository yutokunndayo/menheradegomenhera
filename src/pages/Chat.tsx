import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import TabBar from "../components/TabBar";
import AppHeader from "../components/AppHeader";
import { FiSend } from "react-icons/fi";
import { FiUser } from "react-icons/fi";
import bandageImage from "../assets/bandage.png";
import chatHeartImage from "../assets/chat-heart.png";
import "../styles/Chat.css";

// ===== 型定義 =====
interface Message {
    id: string;
    sender: string;    // UUID（自分 or パートナー）
    text: string;
    time: string;
    isMe: boolean;     // 自分が送ったかどうか
}

type MyGender = "boyfriend" | "girlfriend";

// ===== 性別テーマ =====
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

// ===== DB行をMessageに変換 =====
function rowToMessage(row: Record<string, string>, myId: string): Message {
    const d = new Date(row.send_at);   // created_at → send_at
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return {
        id: String(row.uid),           // id → uid（int8なのでstringに変換）
        sender: row.sender,
        text: row.text,
        time,
        isMe: row.sender === myId,
    };
}

function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [partnerName, setPartnerName] = useState("パートナー");
    const [partnerIcon, setPartnerIcon] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [myGender, setMyGender] = useState<MyGender>("boyfriend");
    const [myId, setMyId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ===== 最下部へ自動スクロール =====
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ===== プロフィール取得 + 過去メッセージ読み込み + リアルタイム購読 =====
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            // 1. ログインユーザー取得
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !isMounted) return;

            setMyId(user.id);

            // 2. 自分のプロフィール取得
            const { data: myProfile } = await supabase
                .from("profiles")
                .select("name, gender, partner, avatar")
                .eq("id", user.id)
                .single();
            if (!myProfile || !isMounted) return;

            // genderはSetupで true=彼女 / false=彼氏 で保存
            setMyGender(myProfile.gender === true ? "girlfriend" : "boyfriend");

            const pId = myProfile.partner;
            if (!pId) return;
            setPartnerId(pId);

            // 3. パートナーのプロフィール取得
            const { data: partnerProfile } = await supabase
                .from("profiles")
                .select("name, avatar")
                .eq("id", pId)
                .single();

            if (partnerProfile && isMounted) {
                setPartnerName(partnerProfile.name ?? "パートナー");
                if (partnerProfile.avatar) {
                    const { data: urlData } = supabase.storage
                        .from("avatars")
                        .getPublicUrl(partnerProfile.avatar);
                    setPartnerIcon(urlData.publicUrl);
                }
            }

            // 4. 過去メッセージを取得（自分とパートナーのチャットのみ、is_memory=false）
            const { data: rows } = await supabase
                .from("messages")
                .select("uid, sender, text, send_at")   // id→uid, created_at→send_at
                .eq("is_memory", false)
                .in("sender", [user.id, pId])
                .order("send_at", { ascending: true })  // created_at→send_at
                .limit(100);

            if (rows && isMounted) {
                setMessages(rows.map(r => rowToMessage(r, user.id)));
            }

            // 5. リアルタイム購読（パートナーの新着メッセージを即時受信）
            channelRef.current = supabase
                .channel(`chat-${[user.id, pId].sort().join("-")}`)  // ユニークなチャンネル名
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages",
                        // パートナーが送ったメッセージだけを受信
                        filter: `sender=eq.${pId}`,
                    },
                    (payload) => {
                        if (!isMounted) return;
                        const newMsg = rowToMessage(
                            payload.new as Record<string, string>,
                            user.id
                        );
                        setMessages(prev => {
                            // uid で重複チェック
                            if (prev.find(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                    }
                )
                .subscribe();
        };

        init();

        // クリーンアップ（画面離脱時にリアルタイム購読を解除）
        return () => {
            isMounted = false;
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    // ===== 送信処理 =====
    const handleSend = async () => {
        const text = input.trim();
        if (!text || !myId || sending) return;

        setSending(true);
        setInput("");

        // 楽観的UI: 送信前に即座に画面に追加
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: Message = {
            id: tempId,
            sender: myId,
            text,
            time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
            isMe: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);

        // DBに保存
        const { data, error } = await supabase.from("messages").insert({
            sender: myId,
            text,
            send_at: new Date().toISOString(),  // send_at を明示的にセット
            is_memory: false,
        }).select("uid, sender, text, send_at").single();

        setSending(false);

        if (error) {
            console.error("送信エラー:", error.message);
            // 失敗したら楽観的UIを取り消す
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setInput(text); // 入力欄に戻す
            return;
        }

        if (data) {
            // 仮IDを本物のDBのIDに差し替える
            setMessages(prev =>
                prev.map(m => m.id === tempId ? rowToMessage(data, myId) : m)
            );
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

                            {/* パートナーアイコン */}
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

                            {/* バブル本体 + 装飾 */}
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

            {/* 入力バー */}
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

export default Chat;