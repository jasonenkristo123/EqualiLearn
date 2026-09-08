import type { ChatGroup } from "../service/groups";
import { initials } from "../util/discussion";

export function AvatarStack({ members }: { members: ChatGroup["members"] }) {
  const shown = members.slice(0, 3);
  const rest = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((member, index) => (
        <span
          key={member.userId || member.email || index}
          title={member.name || member.email}
          className="grid h-7 w-7 place-items-center rounded-full border-2 border-app-surface-muted bg-gradient-to-br from-sky-500 to-indigo-500 text-[10px] font-semibold text-static-white"
        >
          {initials(member.name || member.email || "?")}
        </span>
      ))}
      {rest > 0 && (
        <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-app-surface-muted bg-white/15 text-[10px] font-semibold text-white">
          +{rest}
        </span>
      )}
      {members.length === 0 && (
        <span className="text-[11px] text-white/40">Belum ada anggota</span>
      )}
    </div>
  );
}
