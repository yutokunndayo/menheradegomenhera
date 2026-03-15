import { supabase } from "./supabase";

// ===== ログイン後のリダイレクト先を決定する共通処理 =====
//
// 優先順位:
// 1. sessionStorage に pendingJoin がある → そこへ（招待リンクから来た場合）
// 2. genderが未設定 → /setup（初回ユーザー）
// 3. partnerが未設定 → /invite（パートナー未接続）
// 4. それ以外 → /chat
//
// 使い方:
//   const dest = await getAfterLoginDest(user.id);
//   navigate(dest, { replace: true });

export async function getAfterLoginDest(userId: string): Promise<string> {
    // 招待リンクから来た場合（sessionStorageにpendingJoinが保存されている）
    const pendingJoin = sessionStorage.getItem("pendingJoin");
    if (pendingJoin) {
        sessionStorage.removeItem("pendingJoin"); // 使ったら消す
        return pendingJoin;
    }

    // プロフィールを取得してフローを判定
    const { data: profile } = await supabase
        .from("profiles")
        .select("gender, partner")
        .eq("id", userId)
        .single();

    // 初回ユーザー（genderが未設定）→ Setup
    if (!profile?.gender) return "/setup";

    // パートナー未接続 → Invite
    if (!profile?.partner) return "/invite";

    // 通常ログイン → Chat
    return "/chat";
}