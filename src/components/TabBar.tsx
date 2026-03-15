import { useNavigate, useLocation } from "react-router-dom";
import {
    HiOutlineHome,
    HiOutlinePhoto,
    HiOutlineCalendarDays,
    HiOutlineClipboardDocumentList,
    HiChatBubbleOvalLeftEllipsis,
} from "react-icons/hi2";
import "./Tabbar.css";

const tabs = [
    { path: "/home", label: "ホーム", Icon: HiOutlineHome },
    { path: "/album", label: "画像", Icon: HiOutlinePhoto },
    { path: "/chat", label: "", Icon: HiChatBubbleOvalLeftEllipsis, isCenter: true },
    { path: "/calendar", label: "カレンダー", Icon: HiOutlineCalendarDays },
    { path: "/diary", label: "メモ", Icon: HiOutlineClipboardDocumentList },
];

// ===== 窪み付きSVGライン =====
// タブバー上部のピンクのライン。中央ボタンの真上だけ内側に凹む。
// preserveAspectRatio="none" で画面幅に合わせて引き伸ばされる。
// viewBox幅400のうち、左158〜右242の範囲を凹ませている。
function NotchedLine() {
    return (
        <svg
            className="tabbar-top-line"
            viewBox="0 0 400 28"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Y座標を1→8に上げることでラインが下に表示される */}
            <path
                d="M 0,8 L 155,8 Q 168,8 176,20 A 24,24 0 0,0 224,20 Q 232,8 245,8 L 400,8"
                fill="none"
                stroke="#f5317f"
                strokeWidth="1.5"
            />
        </svg>
    );
}

function TabBar() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="tabbar-wrapper">
            {/* 窪み付きピンクライン */}
            <NotchedLine />

            <div className="tabbar">
                {tabs.map((tab) => {
                    // /diary-calendar, /diary-detail なども /diary タブをアクティブにする
                    const active = location.pathname === tab.path
                        || (tab.path === "/diary" && location.pathname.startsWith("/diary"));

                    // ===== 中央チャットボタン =====
                    if (tab.isCenter) {
                        return (
                            <button
                                key="center"
                                className="tabbar-center-btn"
                                onClick={() => navigate(tab.path)}
                                aria-label="チャット"
                            >
                                <tab.Icon size={28} color="white" />
                            </button>
                        );
                    }

                    // ===== 通常タブ =====
                    return (
                        <button
                            key={`${tab.path}-${tab.label}`}
                            className={`tabbar-item ${active ? "active" : ""}`}
                            onClick={() => navigate(tab.path)}
                            aria-label={tab.label}
                        >
                            <tab.Icon size={26} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default TabBar;