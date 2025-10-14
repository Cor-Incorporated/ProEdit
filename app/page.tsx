import { redirect } from "next/navigation";
import { getUser } from "@/app/actions/auth";

export default async function HomePage() {
  const user = await getUser();

  if (user) {
    // 認証済み → ダッシュボードへ
    redirect("/editor");
  } else {
    // 未認証 → ログインページへ
    redirect("/login");
  }
}
