import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import TabBar from "../components/TabBar";
import "../styles/Chat.css";

// ===== 型定義 =====
interface Message {
    id: string;
    sender: "me" | "partner";
    text: string;
    time: string;
}

// ===== 性別の型 =====
// 現在は "boyfriend"（自分） / "girlfriend"（相手）固定
// カラム追加後は supabase の profiles.my_gender / profiles.partner_gender から取得する
type Gender = "boyfriend" | "girlfriend";

// ===== 性別ごとのスタイル設定 =====
// ここを変えると見た目が切り替わる
//
// 【カラム追加後の対応手順】
// 1. supabase の profiles テーブルに以下を追加してもらう
//    - my_gender      : "boyfriend" | "girlfriend"
//    - partner_gender : "boyfriend" | "girlfriend"
// 2. 下の fetchGender() のコメントアウトを解除して実際に取得する
// 3. GENDER_THEME の key に合わせて値が入ってくれば自動で見た目が切り替わる
const GENDER_THEME: Record<Gender, {
    // バブルのCSSクラス（chat.css で定義）
    myBubbleClass: string;       // 自分のメッセージバブル
    partnerBubbleClass: string;  // 相手のメッセージバブル
    // リボン装飾の絵文字（画像に差し替える場合は ribbonImage を使う）
    myRibbon: string;
    partnerRibbon: string;
    // リボン画像パス（画像を用意したら文字列で指定、null なら絵文字にフォールバック）
    myRibbonImage: string | null;
    partnerRibbonImage: string | null;
}> = {
    // 自分が彼氏・相手が彼女 のテーマ
    boyfriend: {
        myBubbleClass: "bubble-me-boyfriend",
        partnerBubbleClass: "bubble-partner-girlfriend",
        myRibbon: "🎀",
        partnerRibbon: "🎀",
        myRibbonImage: null,       // 例: "/ribbons/blue-ribbon.png"
        partnerRibbonImage: null,  // 例: "/ribbons/pink-ribbon.png"
    },
    // 自分が彼女・相手が彼氏 のテーマ（将来用）
    girlfriend: {
        myBubbleClass: "bubble-me-girlfriend",
        partnerBubbleClass: "bubble-partner-boyfriend",
        myRibbon: "🎀",
        partnerRibbon: "🎀",
        myRibbonImage: null,
        partnerRibbonImage: null,
    },
};

// ===== ダミーメッセージ（DBに繋ぐ場合は差し替え） =====
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

    // ===== 性別 state =====
    // 現在は固定値。カラム追加後は fetchGender() で取得した値をセットする
    // myGender    : 自分の性別（バブル色・装飾を決める）
    // partnerGender: 相手の性別（相手バブル色・装飾を決める）
    const [myGender, setMyGender] = useState<Gender>("boyfriend");
    const [partnerGender, setPartnerGender] = useState<Gender>("girlfriend");

    // 現在の性別に対応するテーマを取得
    // ※ myGender を基準にテーマを選んでいる（自分が彼氏か彼女かで全体テーマが変わる）
    const theme = GENDER_THEME[myGender];

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // ===== パートナー情報・性別の取得 =====
            // 【カラム追加後】以下のコメントを解除して使う
            // profiles テーブルに my_gender, partner_gender, name, icon_url が追加された想定
            //
            // const { data } = await supabase
            //   .from("profiles")
            //   .select("name, icon_url, my_gender, partner_gender")
            //   .eq("id", user.id)
            //   .single();
            //
            // if (data) {
            //   setPartnerName(data.name ?? "彼女ちゃん");
            //   setPartnerIcon(data.icon_url ?? null);
            //   setMyGender(data.my_gender ?? "boyfriend");
            //   setPartnerGender(data.partner_gender ?? "girlfriend");
            // }
        };
        fetchData();
    }, []);

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        const newMsg: Message = {
            id: Date.now().toString(),
            sender: "me",
            text,
            time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, newMsg]);
        setInput("");
    };

    return (
        <div className="chat-wrapper">

            {/* ===== スカラップヘッダー ===== */}
            <div className="chat-header">
                <div className="chat-header-icon">
                    {partnerIcon ? (
                        // アイコン画像が設定されたらこちらが表示される
                        <img src={partnerIcon} alt={partnerName} className="chat-partner-img" />
                    ) : (
                        // アイコン未設定時のプレースホルダー
                        // Home.tsx でアイコンを設定したら partnerIcon に URL を渡すだけで切り替わる
                        <div className="chat-partner-placeholder" aria-label="パートナーアイコン">
                            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                                <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.8" />
                                <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        </div>
                    )}
                </div>
                <p className="chat-header-name">{partnerName}</p>
            </div>

            {/* ===== メッセージエリア ===== */}
            <div className="chat-messages">

                {/*
          ===== 上部装飾画像 =====
          チャット画面上部（最初のメッセージより上）に表示する装飾
          画像を用意したら以下のコメントを解除して画像パスを指定する
          性別によって画像を変えたい場合は myGender で分岐する

          例:
          <img
            src={myGender === "boyfriend" ? "/deco/top-blue.png" : "/deco/top-pink.png"}
            alt=""
            className="chat-deco-top"
          />
        */}

                {messages.map((msg, i) => {
                    const isPartner = msg.sender === "partner";

                    // 連続するパートナーメッセージの最初だけアイコンを表示
                    const showIcon =
                        isPartner && (i === 0 || messages[i - 1].sender !== "partner");

                    // ===== バブルクラスの決定 =====
                    // 自分 → theme.myBubbleClass
                    // 相手 → theme.partnerBubbleClass
                    // テーマは myGender の値によって GENDER_THEME から取得される
                    const bubbleClass = isPartner
                        ? theme.partnerBubbleClass
                        : theme.myBubbleClass;

                    // ===== リボン装飾の決定 =====
                    // 画像がある場合は img タグで表示、なければ絵文字にフォールバック
                    const ribbonImage = isPartner
                        ? theme.partnerRibbonImage
                        : theme.myRibbonImage;
                    const ribbonEmoji = isPartner
                        ? theme.partnerRibbon
                        : theme.myRibbon;

                    return (
                        <div
                            key={msg.id}
                            className={`chat-row ${isPartner ? "row-partner" : "row-me"}`}
                        >
                            {/* パートナー側のアイコン領域 */}
                            {isPartner && (
                                <div className="chat-row-icon">
                                    {showIcon && (
                                        partnerIcon ? (
                                            <img src={partnerIcon} alt="" className="bubble-partner-img" />
                                        ) : (
                                            <div className="bubble-partner-placeholder">
                                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                                    <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2" />
                                                    <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            <div className="chat-bubble-wrap">
                                {/* バブル本体 — bubbleClass で色・形が切り替わる */}
                                <div className={`chat-bubble ${bubbleClass}`}>
                                    {msg.text.split("\n").map((line, j) => (
                                        <span key={j}>
                                            {line}
                                            {j < msg.text.split("\n").length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>

                                {/* ===== リボン装飾 =====
                    画像がある場合: <img> で表示
                    画像がない場合: 絵文字で表示
                    どちらも ribbon-partner / ribbon-me クラスで位置を切り替え */}
                                {ribbonImage ? (
                                    <img
                                        src={ribbonImage}
                                        alt=""
                                        className={`bubble-ribbon ${isPartner ? "ribbon-partner" : "ribbon-me"}`}
                                    />
                                ) : (
                                    <div className={`bubble-ribbon-placeholder ${isPartner ? "ribbon-partner" : "ribbon-me"}`}>
                                        {ribbonEmoji}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/*
          ===== 下部装飾画像 =====
          最新メッセージの下に表示する装飾
          画像を用意したら以下のコメントを解除して画像パスを指定する

          例:
          <img
            src={myGender === "boyfriend" ? "/deco/bottom-blue.png" : "/deco/bottom-pink.png"}
            alt=""
            className="chat-deco-bottom"
          />
        */}

                <div ref={bottomRef} />
            </div>

            {/* ===== 入力バー ===== */}
            <div className="chat-input-bar">
                <input
                    className="chat-input"
                    type="text"
                    placeholder="メッセージを入力"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    aria-label="送信"
                >
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                        <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            <TabBar />
        </div>
    );
}

export default Chat;