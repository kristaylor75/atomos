export default function SystemStatTextRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest opacity-70">{label}</span>
      <span className="text-[11px] font-mono opacity-90">{value}</span>
    </div>
  );
}