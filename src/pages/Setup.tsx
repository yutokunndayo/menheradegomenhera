import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { PiGenderFemaleBold, PiGenderMaleBold } from "react-icons/pi";
import AuthHeader from "../components/AuthHeader";
import "../styles/login.css";
import "../styles/setup.css";

type Gender = "girlfriend" | "boyfriend" | null;

function Setup() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState("");
    const [gender, setGender] = useState<Gender>(null);
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIconFile(file);
        setIconPreview(URL.createObjectURL(file));
    };

    const handleIconReset = () => {
        setIconFile(null);
        setIconPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async () => {
        if (!name.trim()) { setError("名前を入力してください"); return; }
        if (!gender) { setError("彼女・彼氏を選択してください"); return; }

        setError(null);
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインしていません");

            let avatarUrl: string | null = null;
            if (iconFile) {
                const ext = iconFile.name.split(".").pop();
                const filePath = `avatars/${user.id}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(filePath, iconFile, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
                avatarUrl = urlData.publicUrl;
            }

            const { error: upsertError } = await supabase.from("profiles").upsert({
                id: user.id,
                name: name.trim(),
                gender,
                avatar: avatarUrl,
            });
            if (upsertError) throw upsertError;

            navigate("/chat", { replace: true });
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "エラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            {/* ヘッダー（戻るボタンなし） */}
            <AuthHeader />

            <div className="auth-container">
                <div className="auth-section">

                    {/* アイコン選択 */}
                    <div className="setup-icon-section">
                        <div
                            className="setup-icon-circle"
                            onClick={() => fileInputRef.current?.click()}
                            role="button"
                            aria-label="アイコンを選択"
                        >
                            {iconPreview ? (
                                <img src={iconPreview} alt="アイコンプレビュー" className="setup-icon-img" />
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" width="36" height="36">
                                        <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.8" />
                                        <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20"
                                            stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                    <div className="setup-icon-camera">
                                        <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                                            <path d="M17 15.5C17 16.05 16.55 16.5 16 16.5H4C3.45 16.5 3 16.05 3 15.5V7.5C3 6.95 3.45 6.5 4 6.5H6L7.5 4.5H12.5L14 6.5H16C16.55 6.5 17 6.95 17 7.5V15.5Z"
                                                stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
                                            <circle cx="10" cy="11" r="2.5" stroke="white" strokeWidth="1.4" />
                                        </svg>
                                    </div>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleIconSelect}
                        />
                        <div className="setup-icon-actions">
                            <button className="setup-icon-btn" onClick={() => fileInputRef.current?.click()}>
                                {iconPreview ? "写真を変更" : "写真を選択"}
                            </button>
                            {iconPreview && (
                                <button className="setup-icon-reset" onClick={handleIconReset}>削除</button>
                            )}
                        </div>
                        <p className="setup-skip-note">※ あとから設定することもできます</p>
                    </div>

                    {/* 名前入力 */}
                    <div className="field-group">
                        <label className="field-label">名前</label>
                        <input
                            className="field-input"
                            type="text"
                            placeholder="あなたの名前を入力"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={20}
                        />
                    </div>

                    {/* 性別選択 */}
                    <div className="field-group">
                        <label className="field-label">あなたは？</label>
                        <div className="setup-gender-row">
                            <button
                                className={`setup-gender-btn ${gender === "girlfriend" ? "selected" : ""}`}
                                onClick={() => setGender("girlfriend")}
                            >
                                <PiGenderFemaleBold
                                    size={36}
                                    color={gender === "girlfriend" ? "#f5317f" : "#cccccc"}
                                />
                                <span>彼女</span>
                            </button>
                            <button
                                className={`setup-gender-btn ${gender === "boyfriend" ? "selected" : ""}`}
                                onClick={() => setGender("boyfriend")}
                            >
                                <PiGenderMaleBold
                                    size={36}
                                    color={gender === "boyfriend" ? "#f5317f" : "#cccccc"}
                                />
                                <span>彼氏</span>
                            </button>
                        </div>
                    </div>

                    {error && <p className="auth-error">{error}</p>}

                    <button className="btn-primary" onClick={handleSave} disabled={loading}>
                        {loading ? "保存中..." : "はじめる"}
                    </button>

                    <button className="switch-link" onClick={() => navigate("/chat")}>
                        スキップ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Setup;