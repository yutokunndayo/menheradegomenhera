import { useState, useRef, useCallback, useEffect } from "react";
import sageImage from "../assets/master.png";

export interface SageMessage {
    id: string;
    text: string;
}

export interface SageWidgetProps {
    message?: SageMessage | null;
    isBoyfriend: boolean;
}

const BUBBLE_THEME = {
    bg: "#e8f4fd",
    border: "#4dd0e1",
};

function SageWidget({ isBoyfriend, message: externalMessage }: SageWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState<SageMessage | null>(null);
    const [hasUnread, setHasUnread] = useState(false);
    const [isPopping, setIsPopping] = useState(false);

    useEffect(() => {
        if (!externalMessage) return;
        setMessage(externalMessage);
        setHasUnread(true);
        setIsOpen(true);
        setIsPopping(true);
        setTimeout(() => setIsPopping(false), 400);
    }, [externalMessage]);

    const [pos, setPos] = useState({
        x: window.innerWidth - 70,
        y: window.innerHeight - 160,
    });
    const dragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const didDrag = useRef(false);

    const onDragStart = useCallback((clientX: number, clientY: number) => {
        dragging.current = true;
        didDrag.current = false;
        dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y };
    }, [pos]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!dragging.current) return;
            didDrag.current = true;
            setPos({
                x: Math.max(0, Math.min(window.innerWidth - 54, e.clientX - dragOffset.current.x)),
                y: Math.max(0, Math.min(window.innerHeight - 54, e.clientY - dragOffset.current.y)),
            });
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!dragging.current) return;
            didDrag.current = true;
            const t = e.touches[0];
            setPos({
                x: Math.max(0, Math.min(window.innerWidth - 54, t.clientX - dragOffset.current.x)),
                y: Math.max(0, Math.min(window.innerHeight - 54, t.clientY - dragOffset.current.y)),
            });
        };

        const onEnd = () => {
            dragging.current = false;
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onEnd);
        window.addEventListener("touchmove", onTouchMove, { passive: true });
        window.addEventListener("touchend", onEnd);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onEnd);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onEnd);
        };
    }, []);

    const handleIconTap = useCallback(() => {
        if (didDrag.current) return;
        if (!message) return;

        if (isOpen) {
            setIsOpen(false);
        } else {
            setIsOpen(true);
            setHasUnread(false);
            setIsPopping(true);
            setTimeout(() => setIsPopping(false), 400);
        }
    }, [isOpen, message]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setHasUnread(false);
    }, []);

    if (!isBoyfriend) return null;

    const bubbleBottom = window.innerHeight - pos.y + 8;
    const bubbleRight = Math.max(8, window.innerWidth - pos.x - 54);

    return (
        <>
            {isOpen && message && (
                <div
                    style={{
                        position: "fixed",
                        bottom: bubbleBottom,
                        right: bubbleRight,
                        zIndex: 9999,
                        maxWidth: 230,
                        minWidth: 150,
                        background: BUBBLE_THEME.bg,
                        border: `2px solid ${BUBBLE_THEME.border}`,
                        borderRadius: 16,
                        padding: "10px 28px 10px 12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                        fontFamily: "Hiragino Kaku Gothic ProN, Noto Sans JP, sans-serif",
                        opacity: isPopping ? 0.8 : 1,
                        transition: "opacity 0.2s",
                    }}
                >
                    <button
                        onClick={handleClose}
                        style={{
                            position: "absolute",
                            top: 6,
                            right: 8,
                            background: "none",
                            border: "none",
                            fontSize: 11,
                            color: "#aaa",
                            cursor: "pointer",
                        }}
                    >
                        ✕
                    </button>

                    <p
                        style={{
                            fontSize: 13,
                            lineHeight: 1.65,
                            color: "#333",
                            margin: 0,
                            wordBreak: "break-all",
                        }}
                    >
                        {message.text}
                    </p>

                    <div
                        style={{
                            position: "absolute",
                            bottom: -11,
                            right: 18,
                            width: 0,
                            height: 0,
                            borderLeft: "8px solid transparent",
                            borderRight: "8px solid transparent",
                            borderTop: `11px solid ${BUBBLE_THEME.border}`,
                        }}
                    />
                </div>
            )}

            <div
                onMouseDown={(e) => {
                    e.preventDefault();
                    onDragStart(e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                    onDragStart(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onClick={handleIconTap}
                style={{
                    position: "fixed",
                    left: pos.x,
                    top: pos.y,
                    zIndex: 9999,
                    width: 81,
                    height: 81,
                    borderRadius: "50%",
                    background: "none",
                    border: "none",
                    boxShadow: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: message ? "grab" : "default",
                    userSelect: "none",
                    animation: "sage-float 3.5s ease-in-out infinite",
                }}
                aria-label="仙人に相談"
            >
                <img
                    src={sageImage}
                    alt="仙人"
                    style={{
                        width: 81,
                        height: 81,
                        objectFit: "contain",
                        pointerEvents: "none",
                        userSelect: "none",
                        draggable: false,
                    } as React.CSSProperties}
                    draggable={false}
                />

                {hasUnread && !isOpen && (
                    <span
                        style={{
                            position: "absolute",
                            top: 1,
                            right: 1,
                            width: 13,
                            height: 13,
                            background: "#f44336",
                            borderRadius: "50%",
                            border: "2px solid white",
                        }}
                    />
                )}
            </div>

            <style>{`
                @keyframes sage-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
            `}</style>
        </>
    );
}

export default SageWidget;