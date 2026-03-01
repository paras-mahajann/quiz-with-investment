import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppShell({ title, subtitle, children }) {
  const { role, user, logout } = useAuth();

  return (
    <div className="page-shell">
      <header className="top-bar">
        <div>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="top-actions">
          {role ? <span className="pill">{role}</span> : null}
          {user?.teamId ? <span className="pill">{user.teamId}</span> : null}
          {user?.adminId ? <span className="pill">{user.adminId}</span> : null}
          {role ? (
            <button className="btn btn-soft" onClick={logout}>
              Logout
            </button>
          ) : (
            <Link className="btn btn-soft" to="/">
              Home
            </Link>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default AppShell;
