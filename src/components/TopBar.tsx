const LOGO_SRC = `${import.meta.env.BASE_URL}favico/apple-touch-icon.png`;

type TopBarProps = {
  email: string | null;
  onSignOut: () => Promise<void>;
  isSigningOut?: boolean;
  /** Mobile only: whether the nav drawer is open */
  menuOpen?: boolean;
  /** Mobile only: toggle the nav drawer */
  onMenuToggle?: () => void;
};

export function TopBar({
  email,
  onSignOut,
  isSigningOut = false,
  menuOpen = false,
  onMenuToggle
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <img src={LOGO_SRC} alt="" className="topbar__logo" />
        <div>
          <h1>SisuCards</h1>
          <p className="topbar__email muted">{email ?? "Authenticated user"}</p>
        </div>
      </div>
      <div className="topbar__actions">
        {onMenuToggle != null ? (
          <button
            type="button"
            className="topbar__menu-btn"
            onClick={onMenuToggle}
            aria-expanded={menuOpen}
            aria-controls="nav-drawer"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <span className="topbar__menu-btn-inner" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => void onSignOut()}
          disabled={isSigningOut}
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </header>
  );
}
