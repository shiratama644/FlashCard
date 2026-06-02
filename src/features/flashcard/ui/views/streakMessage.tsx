// 連続記録メッセージを JSX（ReactNode）として構築する。
// 旧実装は HTML 文字列を組み立て dangerouslySetInnerHTML で描画していたが、
// XSS 面・保守性の観点で JSX へ置換。文言・改行（\n / CSS white-space: pre-wrap）・
// ハイライト色（text-[#ff7b00]）は old-site と完全一致させる。
import type { ReactNode } from "react";

// ハイライト（橙色）部分。
const hl = (text: string): ReactNode => <span className="text-[#ff7b00]">{text}</span>;

// streak: streakData.currentStreak、now: 曜日/日付の判定に使用（既定は現在時刻）。
export function buildStreakMessage(streak: number, now: Date = new Date()): ReactNode {
  const today = now.getDay();
  const isWeekend = today === 0 || today === 6;

  if (streak === 0) {
    return <>今日から{hl("新しい記録")}を始めましょう！</>;
  } else if (streak === 1) {
    return (
      <>
        素晴らしいスタートです！{"\n"}明日も{hl("頑張りましょう！")}
      </>
    );
  } else if (streak % 100 === 0) {
    return (
      <>
        信じられません！ついに{hl(`${streak}日達成`)}！{"\n"}鉄の意志ですね！
      </>
    );
  } else if (streak % 50 === 0) {
    return (
      <>
        すごい！{hl(`${streak}日連続`)}達成！{"\n"}毎日の積み重ねの賜物です！
      </>
    );
  } else if (streak % 10 === 0) {
    return (
      <>
        おめでとう！{hl(`${streak}日連続`)}達成！{"\n"}この調子で続けましょう！
      </>
    );
  } else if (streak % 7 === 0) {
    return (
      <>
        おめでとう！{hl("パーフェクトな連続記録")}を達成したね！{"\n"}来週も続けられるかな？
      </>
    );
  } else if (isWeekend) {
    return (
      <>
        週末も{hl("記録を伸ばそう！")}
        {"\n"}継続は力なり！
      </>
    );
  } else {
    const messages: ReactNode[] = [
      <>
        素晴らしいペースです！{"\n"}
        {hl("その調子")}で明日も頑張りましょう！
      </>,
      <>
        いいペースですね！{"\n"}
        {hl("毎日の学習")}が力になります！
      </>,
      <>
        今日も学習できましたね！{"\n"}
        {hl("連続記録")}をどんどん伸ばそう！
      </>,
      <>
        止まらない勢いですね！{"\n"}
        {hl("明日も")}この場所で会いましょう！
      </>,
    ];
    const seed = now.getDate();
    return messages[seed % messages.length];
  }
}
