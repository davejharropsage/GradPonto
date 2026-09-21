import Link from "next/link";
import { Brand } from "@/components/brand/brand";
import { EmailForm } from "@/components/auth/email-form";

/** Shared SVG definitions: the four-point sparkle used as a decorative motif around the page. */
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <symbol id="gp-sparkle" viewBox="0 0 24 24">
          <path d="M12 0c0 6.6 5.4 12 12 12-6.6 0-12 5.4-12 12 0-6.6-5.4-12-12-12 6.6 0 12-5.4 12-12z" />
        </symbol>
      </defs>
    </svg>
  );
}

/**
 * Top bar. "Get started free" sits top right and leads to the sign-in page. People who are
 * already signed in see a way back into the app instead.
 */
export function LandingHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="site-header">
      <div className="wrap header__inner">
        <Link className="brand" href="/landing" aria-label="GradPonto home">
          <Brand size={34} />
        </Link>
        <nav className="nav" aria-label="Main">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#built">Why GradPonto</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="header__cta">
          {signedIn ? (
            <Link className="gp-btn gp-btn--sm" href="/">
              Open your dashboard
            </Link>
          ) : (
            <>
              <Link className="gp-btn gp-btn--ghost gp-btn--sm header__signin" href="/signin">
                Sign in
              </Link>
              <Link className="gp-btn gp-btn--sm" href="/signin">
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Closing call to action, with the same email form as the sign-in page. */
export function LandingCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="section" id="get-started">
      <div className="wrap">
        <div className="cta gp-panel gp-panel--dark gp-dark">
          <div className="cta__glow" aria-hidden="true" />
          <svg className="gp-sparkle spk c1" width="38" height="38" aria-hidden="true"><use href="#gp-sparkle" /></svg>
          <svg className="gp-sparkle spk c2" width="20" height="20" aria-hidden="true"><use href="#gp-sparkle" /></svg>
          <svg className="gp-sparkle spk c3" width="28" height="28" aria-hidden="true"><use href="#gp-sparkle" /></svg>
          <h2 className="h2 h2--xl">
            Take the lead in your <span className="gp-gradient-text">placement hunt</span>
          </h2>
          {signedIn ? (
            <>
              <p className="lede lede--on-dark">You&apos;re signed in. Pick up where you left off.</p>
              <Link className="gp-btn gp-btn--light gp-btn--lg" href="/">
                Open your dashboard
              </Link>
            </>
          ) : (
            <>
              <p className="lede lede--on-dark">
                Create your account in a minute. We&apos;ll email you a one-time code, so there&apos;s no password to set up.
              </p>
              <div className="cta__email">
                <EmailForm tone="dark" buttonLabel="Get started free" />
              </div>
              <p className="cta__signin">
                Already have an account? <Link href="/signin">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="site-footer gp-dark">
      <div className="wrap footer__inner">
        <div className="footer__brand">
          <Link className="brand brand--light" href="/landing" aria-label="GradPonto home">
            <Brand tone="light" size={34} />
          </Link>
          <p>Find, apply and track UK placements, internships and apprenticeships.</p>
        </div>
        <nav className="footer__nav" aria-label="Footer">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#built">Why GradPonto</a>
          <a href="#faq">FAQ</a>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <p className="footer__legal">© {new Date().getFullYear()} GradPonto. All rights reserved.</p>
      </div>
    </footer>
  );
}
