import { Home, Heart, ClipboardList, Headset } from "lucide-react";

const items = [
  { label: "Home", icon: Home, active: true },
  { label: "Favorites", icon: Heart },
  { label: "Orders", icon: ClipboardList },
  { label: "Support", icon: Headset },
];

export default function Navbar() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-3 left-1/2 z-20 w-[min(900px,calc(100%-24px))] -translate-x-1/2 rounded-[28px] bg-[#fde68a] shadow-[0_2px_10px_rgba(120,90,20,0.1)]"
    >
      <ul className="m-0 flex list-none items-stretch justify-around px-3 py-2">
        {items.map(({ label, icon: Icon, active }) => (
          <li key={label} className="flex flex-1 justify-center">
            <a href="#"
              aria-current={active ? "page" : undefined}
              className="group flex min-h-11 min-w-16 flex-col items-center gap-0.5 px-2 py-0.5 text-[#2a2418] no-underline">
              <span className={`grid h-11 w-11 place-items-center rounded-full ${
                  active
                    ? "bg-[#f7891f] text-white"
                    : "group-hover:bg-[#fef3c7]"
                }`}>
                <Icon size={24} strokeWidth={2} aria-hidden="true" />
              </span>
              <span
                className={`text-xs leading-tight ${
                  active ? "font-bold text-[#d9700a]" : ""
                }`}>
                {label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}