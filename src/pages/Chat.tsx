import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import TabBar from "../components/TabBar";
import AppHeader from "../components/AppHeader";
import { FiSend } from "react-icons/fi";
import { FiUser } from "react-icons/fi";

// ===== 装飾画像 import =====
// 彼女のメッセージ右上: 絆創膏
import bandageImage from "../assets/bandage.png";
// 彼氏のメッセージ右下: ハート
import chatHeartImage from "../assets/chat-heart.png";

import "../styles/Chat.css";

// ===== 型定義 =====
interface Message {
    id: string;
    sender: "me" | "partner";
    text: string;
    time: string;
}

// "boyfriend" = 自分が彼氏 → 相手は必ず彼女
// "girlfriend" = 自分が彼女 → 相手は必ず彼氏
type MyGender = "boyfriend" | "girlfriend";

// ===== 性別ごとのスタイル設定 =====
const GENDER_THEME: Record<MyGender, {
    myBubbleClass: string;
    partnerBubbleClass: string;
    // 装飾画像と配置クラス
    // 彼女のバブル → 右上に絆創膏
    // 彼氏のバブル → 右下にハート
    myDecoImage: string | null;
    partnerDecoImage: string | null;
    myDecoClass: string;        // CSS位置クラス
    partnerDecoClass: string;   // CSS位置クラス
}> = {
    // 自分が彼氏のテーマ
    boyfriend: {
        myBubbleClass: "bubble-me-boyfriend",
        partnerBubbleClass: "bubble-partner-girlfriend",
        // 自分（彼氏）→ ハートを右下
        myDecoImage: chatHeartImage,
        myDecoClass: "deco-bottom-right",
        // パートナー（彼女）→ 絆創膏を右上
        partnerDecoImage: bandageImage,
        partnerDecoClass: "deco-top-right",
    },
    // 自分が彼女のテーマ
    girlfriend: {
        myBubbleClass: "bubble-me-girlfriend",
        partnerBubbleClass: "bubble-partner-boyfriend",
        // 自分（彼女）→ 絆創膏を右上
        myDecoImage: bandageImage,
        myDecoClass: "deco-top-right",
        // パートナー（彼氏）→ ハートを右下
        partnerDecoImage: chatHeartImage,
        partnerDecoClass: "deco-bottom-right",
    },
};

// ===== ダミーメッセージ（DBに繋いだら差し替え） =====
const dummyMessages: Message[] = [
    { id: "1", sender: "partner", text: "会いたい", time: "10:00" },
    { id: "2", sender: "me", text: "俺もだよ\n早く会いたい", time: "10:01" },
    { id: "3", sender: "partner", text: "最近返信遅くない？", time: "10:05" },
    { id: "4", sender: "partner", text: "他の子と遊んだりしてないよね", time: "10:05" },
    { id: "5", sender: "partner", text: "ねえ、なにしてるの", time: "10:10" },
    { id: "6", sender: "partner", text: "なんで見てくれないの", time: "10:10" },
    { id: "7", sender: "partner", text: "わざと返してないよね", time: "10:11" },
    { id: "8", sender: "partner", text: "そういうところほんと無理", time: "10:11" },
];

function Chat() {
    const [messages, setMessages] = useState<Message[]>(dummyMessages);
    const [input, setInput] = useState("");
    const [partnerName, setPartnerName] = useState("彼女ちゃん");
    const [partnerIcon, setPartnerIcon] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [myGender, setMyGender] = useState<MyGender>("boyfriend");

    const theme = GENDER_THEME[myGender];
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: myProfile } = await supabase
                .from("profiles")
                .select("name, gender, partner, avatar")
                .eq("id", user.id)
                .single();

            if (!myProfile) return;

            // gender は Setup.tsx で保存した "boyfriend" / "girlfriend" が入ってくる
            // この1行でテーマ全体（自分・相手の両方のバブル色・装飾）が切り替わる
            setMyGender(myProfile.gender === true ? "girlfriend" : "boyfriend");
            // ── Step2: パートナーのプロフィールを取得 ──
            // myProfile.partner が自分のDBに入っている相手のUUID
            // そのUUIDで相手の name / avatar を取得する
            if (myProfile.partner) {
                const { data: partnerProfile } = await supabase
                    .from("profiles")
                    .select("name, avatar")
                    .eq("id", myProfile.partner)
                    .single();

                if (partnerProfile) {
                    setPartnerName(partnerProfile.name ?? "彼女ちゃん");
                    if (partnerProfile.avatar) {
                        const { data: urlData } = supabase.storage
                            .from("avatars")
                            .getPublicUrl(partnerProfile.avatar);
                        setPartnerIcon(urlData.publicUrl);
                    }
                }
            }
        };
        fetchProfile();
    }, []);

    const handleSend = async () => {
        const text = input.trim();
        if (!text) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newMsg: Message = {
            id: Date.now().toString(),
            sender: "me",
            text,
            time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, newMsg]);
        setInput("");

        const { error } = await supabase.from("messages").insert({
            text,
            sender: user.id,
            is_memory: false,
        });
        if (error) console.error("メッセージ保存エラー:", error.message);
    };

    return (
        <div className="chat-wrapper">

            <AppHeader variant="chat" name={partnerName} icon={partnerIcon} />

            <div className="chat-messages">
                {messages.map((msg, i) => {
                    const isPartner = msg.sender === "partner";

                    const showIcon =
                        isPartner && (i === 0 || messages[i - 1].sender !== "partner");

                    const bubbleClass = isPartner
                        ? theme.partnerBubbleClass
                        : theme.myBubbleClass;

                    // ===== 装飾画像と位置の決定 =====
                    // 彼女のバブル → bandage（右上）
                    // 彼氏のバブル → chat-heart（右下）
                    const decoImage = isPartner
                        ? theme.partnerDecoImage
                        : theme.myDecoImage;
                    const decoClass = isPartner
                        ? theme.partnerDecoClass
                        : theme.myDecoClass;

                    return (
                        <div
                            key={msg.id}
                            className={`chat-row ${isPartner ? "row-partner" : "row-me"}`}
                        >
                            {/* パートナーのアイコン領域 */}
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

                            {/* バブル本体 + 装飾画像 */}
                            <div className="chat-bubble-wrap">
                                <div className={`chat-bubble ${bubbleClass}`}>
                                    {msg.text.split("\n").map((line, j) => (
                                        <span key={j}>
                                            {line}
                                            {j < msg.text.split("\n").length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>

                                {/* ===== 装飾画像 =====
                                    decoClass で右上（deco-top-right）か右下（deco-bottom-right）かを切り替える
                                    画像が null の場合は表示しない */}
                                {decoImage && (
                                    <img
                                        src={decoImage}
                                        alt=""
                                        className={`bubble-deco ${decoClass}`}
                                    />
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
                    disabled={!input.trim()}
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