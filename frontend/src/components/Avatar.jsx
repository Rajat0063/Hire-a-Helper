export function Avatar({ src, initials = "U", size = 36 }) {
  const dim = { width: size, height: size };
  if (src) {
    return (
      <img
        src={src}
        alt="avatar"
        style={dim}
        className="rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
      />
    );
  }
  return (
    <div
      style={dim}
      className="rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 grid place-items-center font-bold text-sm shrink-0"
    >
      {initials}
    </div>
  );
}

export default Avatar;
