import { Link } from "react-router-dom";

export default function Tabs() {
  return (
    <nav className="nav">
      <Link to="/admin">Admin</Link>
      <Link to="/">Team</Link>
      <Link to="/screen">Projector</Link>
      <Link to="/summary">Summary</Link>
    </nav>
  );
}
