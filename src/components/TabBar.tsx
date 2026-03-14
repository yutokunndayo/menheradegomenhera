import { useNavigate, useLocation } from "react-router-dom";
import {
    HiOutlineHome,
    HiOutlinePhoto,
    HiOutlineCalendarDays,
    HiOutlineClipboardDocumentList,
    HiChatBubbleOvalLeftEllipsis,
} from "react-icons/hi2";
import "./tabbar.css";

const tabs = [
    { path: "/home", label: "ホーム", Icon: HiOutlineHome },
    { path: "/example", label: "画像", Icon: HiOutlinePhoto },
    { path: "/chat", label: "", Icon: HiChatBubbleOvalLeftEllipsis, isCenter: true },
    { path: "/calendar", label: "カレンダー", Icon: HiOutlineCalendarDays },
    { path: "/example", label: "メモ", Icon: HiOutlineClipboardDocumentList },
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
            {/* 窪み付きピンクライン — tabbar-wrapperの中に収めることで位置が固定される */}
            <NotchedLine />

            <div className="tabbar">
                {tabs.map((tab) => {
                    const active = location.pathname === tab.path;

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