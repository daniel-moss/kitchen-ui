import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";

import styles from "./SignatureModule.module.scss";

/**
 * The captured signature (Figma 21849-103526). Inlined instead of an `<img>`
 * so the ink follows the theme through `currentColor` — the exported SVG
 * hardcodes gray-12's LIGHT value (#202020), which all but disappears on a
 * dark surface. Real captured ink would not adapt; this is a demo drawing.
 */
const SignatureInk = () => (
  <svg
    className={styles.ink}
    viewBox="0 0 146.035 68.7134"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    aria-hidden
  >
    <path d="M33.7095 1.50028C38.1096 9.56716 41.785 18.1502 45.5522 26.5051C47.8975 31.7065 53.3235 43.5738 55.573 49.9078C56.8194 53.4175 56.9474 53.3815 56.2012 56.159C54.7621 61.5159 52.3628 64.7514 46.8401 66.1483C38.1794 68.339 28.1449 66.8992 19.8249 64.1065C12.8126 61.7527 4.05245 58.9374 1.98231 50.9444C-2.09323 35.2083 20.6898 31.3782 31.2593 28.9553C40.4566 26.8469 49.4281 25.814 58.8399 25.814C60.49 25.814 61.6373 25.8878 63.1121 26.3794" />
    <path d="M74.4212 38.8192C71.7072 38.5335 67.7993 45.0832 69.0181 47.552C69.7786 49.0924 71.8086 51.0674 73.6672 51.0075C76.7122 50.9092 82.335 45.4456 78.6619 42.5888C77.1397 41.4048 78.8771 45.7352 78.9446 45.8871C79.5077 47.1542 80.6817 48.8357 81.7718 49.5625" />
    <path d="M84.0335 38.819C85.45 41.7353 86.6805 44.8935 88.5569 47.5518C90.1596 49.8223 89.2314 45.7349 89.1224 45.1644C88.8172 43.5684 89.0258 41.4354 91.0072 40.9551C95.0582 39.973 96.0034 45.041 97.6039 47.3005" />
    <path d="M102.693 37.1227C105.247 39.4642 106.651 50.2002 106.651 46.7351" />
    <path d="M115.698 37.6879C116.174 37.4751 128.577 33.3189 124.745 30.5885C123.021 29.3603 120.102 29.1215 118.085 29.4577C114.237 30.099 112.623 33.6889 114.253 37.2481C114.675 38.1713 119.445 44.1892 120.661 43.2166C121.285 42.7176 121.759 42.1288 122.483 41.6459" />
    <path d="M125.31 2.06572C131.201 14.3663 138.102 26.2387 144.535 38.2536" />
  </svg>
);

/**
 * The three states of the module (Figma "Signature" Module 21849-102410):
 *   notCollected — until the Complete-job flow has been finished
 *   collected    — the drawing plus who signed and when
 *   skipped      — the signature was skipped, so a reason was required
 */
export type SignatureState = "notCollected" | "collected" | "skipped";

export interface SignatureData {
  /** Who signed — plain text, not a user object (Figma). */
  signedBy: string;
  /** "Monday, January 1" — the app-wide date rule adds the year off-year. */
  date: Date;
  /** Why the signature was skipped (the `skipped` state only). */
  skipReason?: string;
  /**
   * The ink the customer actually drew, as a PNG data URL. Without it the
   * module falls back to the placeholder squiggle below — which is what it
   * always showed before the Complete flow was wired up.
   */
  ink?: string;
}

/**
 * What the Complete-job flow's Signature step produced. It travels from the
 * form up to the shell and back down into this module, which is what makes the
 * module leave "Not collected" once a job is completed (Daniel, 2026-08-07).
 */
export type SignatureResult =
  | { state: "collected"; signedBy: string; date: Date; ink?: string }
  | { state: "skipped"; skipReason: string; date: Date };

// The app-wide date rule: weekday + month + day, and the year ONLY when the
// date is not in the current year.
const signatureDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" }),
  }).format(date);

// The "Signature" module (Figma 21849-102410). The header carries NO right
// slot in any state — a signature is captured in the Complete-job flow, never
// edited here.
export default function SignatureModule({ state, data }: { state: SignatureState; data?: SignatureData }) {
  if (state === "collected" && data != null) {
    return (
      <DisplayModule
        title="Signature"
        bodyPadded={false}
        content={
          <div className={styles.collectedBody}>
            <div className={styles.inkBox}>
              {/* The real ink when the Complete flow captured one; the drawn
                  placeholder only when it did not (demo / story data). */}
              {data.ink != null ? <img className={styles.inkImage} src={data.ink} alt="Customer signature" /> : <SignatureInk />}
            </div>
            <ValueDisplayGroup>
              <ValueDisplay orientation="horizontal" kind="text" label="Signed by" value={data.signedBy} />
              <ValueDisplay orientation="horizontal" kind="text" label="Date" value={signatureDate(data.date)} />
            </ValueDisplayGroup>
          </div>
        }
      />
    );
  }

  if (state === "skipped") {
    return (
      <DisplayModule
        title="Signature"
        content={
          <ValueDisplay
            orientation="vertical"
            kind="longText"
            label="Skip signature reason"
            value={data?.skipReason ?? ""}
          />
        }
      />
    );
  }

  return <DisplayModule title="Signature" bodyPadded={false} content={<EmptyState caption="Not collected yet" />} />;
}
