import { Link } from "react-router-dom";
import ContrastSwitcher from "./ContrastSwitcher";

export default function Topbar() {
  return (
    <header className="bg-slate-950/40 border-b border-slate-800 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link
          to="/"
          className="w-9 h-9 rounded-xl bg-blue-600 grid place-items-center font-bold"
        >
          S
        </Link>

        <nav className="ml-auto flex items-center gap-3">
          <Link
            to="/admin"
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700"
          >
            Admin
          </Link>
          {/* <Link
            to="/user"
            className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600"
          >
            Usuário
          </Link> */}

          <ContrastSwitcher />
        </nav>
      </div>
    </header>
  );
}
