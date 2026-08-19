"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";

type EnquiryDialogProps = {
  open: boolean;
  onClose: () => void;
};

type EnquiryDetails = {
  budget: string;
  timeline: string;
  name: string;
  country: string;
  phone: string;
  email: string;
  company: string;
};

const budgets = [
  "Below £300,000",
  "£300,000 to £350,000",
  "£350,000 to £500,000",
  "Above £500,000",
];

const timelines = [
  "Within 3 months",
  "Within 3 to 6 months",
  "Within 6 to 12 months",
  "I am currently researching",
];

const countries = [
  { name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { name: "United States", dial: "+1", flag: "🇺🇸" },
  { name: "Ireland", dial: "+353", flag: "🇮🇪" },
  { name: "India", dial: "+91", flag: "🇮🇳" },
  { name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { name: "Canada", dial: "+1", flag: "🇨🇦" },
  { name: "Australia", dial: "+61", flag: "🇦🇺" },
  { name: "Germany", dial: "+49", flag: "🇩🇪" },
  { name: "France", dial: "+33", flag: "🇫🇷" },
  { name: "Singapore", dial: "+65", flag: "🇸🇬" },
];

const initialDetails: EnquiryDetails = {
  budget: "",
  timeline: "",
  name: "",
  country: "0",
  phone: "",
  email: "",
  company: "",
};

export default function EnquiryDialog({ open, onClose }: EnquiryDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState(initialDetails);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.classList.add("enquiry-open");
    window.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("button, input, select")
        ?.focus();
    }, 80);

    return () => {
      document.body.classList.remove("enquiry-open");
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  const choose = (field: "budget" | "timeline", value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};

    if (step === 1) {
      if (!details.budget) nextErrors.budget = "Choose a budget range.";
      if (!details.timeline) nextErrors.timeline = "Choose a timeframe.";
    }

    if (step === 2) {
      if (details.name.trim().length < 2)
        nextErrors.name = "Enter your full name.";
      if (details.phone.replace(/\D/g, "").length < 7)
        nextErrors.phone = "Enter a valid phone number.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()))
        nextErrors.email = "Enter a valid email address.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goForward = () => {
    if (!validateStep()) return;
    setStep((current) => Math.min(3, current + 1));
  };

  const submitEnquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < 3) {
      goForward();
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");

    const selectedCountry = countries[Number(details.country)] ?? countries[0];
    const localPhone = details.phone.replace(/^\+\d+\s*/, "").trim();

    try {
      const response = await fetch("/api/lead/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: details.name.trim(),
          phone: `${selectedCountry.dial} ${localPhone}`,
          email: details.email.trim(),
          company: details.company,
          country: selectedCountry.name,
          pageUrl: window.location.href,
          referrer: document.referrer,
          qualifiers: {
            budget: details.budget,
            timeline: details.timeline,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Submission failed.");
      }

      window.sessionStorage.setItem("leos_lead", "1");
      setSubmitted(true);
    } catch {
      setSubmitError(
        "We could not send your request. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="enquiry-dialog" role="presentation">
      <button
        type="button"
        className="enquiry-dialog__backdrop"
        onClick={onClose}
        aria-label="Close enquiry form"
      />
      <div
        ref={panelRef}
        className="enquiry-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="enquiry-panel__topline" />
        <button
          type="button"
          className="enquiry-panel__close"
          onClick={onClose}
          aria-label="Close enquiry form"
        >
          ×
        </button>

        {!submitted ? (
          <>
            <div className="enquiry-panel__header">
              <p>Current availability</p>
              <h2 id={titleId}>Receive the private presentation.</h2>
              <span>Floor plans, pricing and all three payment options.</span>
            </div>

            <div className="enquiry-progress" aria-label={`Step ${step} of 3`}>
              <div>
                {[1, 2, 3].map((item) => (
                  <span
                    key={item}
                    className={item <= step ? "is-active" : ""}
                  />
                ))}
              </div>
              <p>
                <span>0{step}</span> / 03
              </p>
            </div>

            <form onSubmit={submitEnquiry} noValidate>
              <div className="enquiry-step" key={step}>
                {step === 1 ? (
                  <>
                    <fieldset>
                      <legend>What is your investment budget?</legend>
                      <div className="enquiry-options">
                        {budgets.map((budget) => (
                          <button
                            type="button"
                            className={details.budget === budget ? "is-selected" : ""}
                            onClick={() => choose("budget", budget)}
                            aria-pressed={details.budget === budget}
                            key={budget}
                          >
                            {budget}
                            <i aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                      {errors.budget ? <small>{errors.budget}</small> : null}
                    </fieldset>
                    <fieldset>
                      <legend>When are you looking to invest?</legend>
                      <div className="enquiry-options enquiry-options--timeline">
                        {timelines.map((timeline) => (
                          <button
                            type="button"
                            className={details.timeline === timeline ? "is-selected" : ""}
                            onClick={() => choose("timeline", timeline)}
                            aria-pressed={details.timeline === timeline}
                            key={timeline}
                          >
                            {timeline}
                            <i aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                      {errors.timeline ? <small>{errors.timeline}</small> : null}
                    </fieldset>
                  </>
                ) : null}

                {step === 2 ? (
                  <div className="enquiry-fields">
                    <label>
                      <span>Full name</span>
                      <input
                        type="text"
                        autoComplete="name"
                        value={details.name}
                        onChange={(event) =>
                          setDetails((current) => ({ ...current, name: event.target.value }))
                        }
                        aria-invalid={Boolean(errors.name)}
                        placeholder="Your full name"
                      />
                      {errors.name ? <small>{errors.name}</small> : null}
                    </label>
                    <label>
                      <span>Email</span>
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={details.email}
                        onChange={(event) =>
                          setDetails((current) => ({ ...current, email: event.target.value }))
                        }
                        aria-invalid={Boolean(errors.email)}
                        placeholder="you@email.com"
                      />
                      {errors.email ? <small>{errors.email}</small> : null}
                    </label>
                    <label className="enquiry-fields__phone">
                      <span>Phone</span>
                      <div>
                        <select
                          aria-label="Country dial code"
                          value={details.country}
                          onChange={(event) =>
                            setDetails((current) => ({ ...current, country: event.target.value }))
                          }
                        >
                          {countries.map((country, index) => (
                            <option value={index} key={`${country.name}-${country.dial}`}>
                              {country.flag} {country.dial}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel-national"
                          value={details.phone}
                          onChange={(event) =>
                            setDetails((current) => ({ ...current, phone: event.target.value }))
                          }
                          aria-invalid={Boolean(errors.phone)}
                          placeholder="Your phone number"
                        />
                      </div>
                      {errors.phone ? <small>{errors.phone}</small> : null}
                    </label>
                    <label className="enquiry-honeypot" aria-hidden="true">
                      Company
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={details.company}
                        onChange={(event) =>
                          setDetails((current) => ({ ...current, company: event.target.value }))
                        }
                      />
                    </label>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="enquiry-review">
                    <div>
                      <span>Investment budget</span>
                      <strong>{details.budget}</strong>
                    </div>
                    <div>
                      <span>Purchase timeline</span>
                      <strong>{details.timeline}</strong>
                    </div>
                    <div>
                      <span>Contact</span>
                      <strong>{details.name}</strong>
                      <p>{details.email}</p>
                    </div>
                    <p className="enquiry-review__note">
                      No obligation. Availability and final pricing will be confirmed by
                      the LEOS advisory team.
                    </p>
                    {submitError ? (
                      <p className="enquiry-submit-error" role="alert">
                        {submitError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="enquiry-controls">
                {step > 1 ? (
                  <button
                    type="button"
                    className="enquiry-controls__back"
                    onClick={() => setStep((current) => current - 1)}
                    disabled={submitting}
                  >
                    Back
                  </button>
                ) : (
                  <span />
                )}
                <button type="submit" className="enquiry-controls__next" disabled={submitting}>
                  {step === 3
                    ? submitting
                      ? "Sending…"
                      : "Request availability"
                    : "Continue"}
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="enquiry-success">
            <span aria-hidden="true">✓</span>
            <p>Request received</p>
            <h2 id={titleId}>Your private presentation is being prepared.</h2>
            <p>
              A LEOS advisor will contact you with current availability, floor plans and
              payment options.
            </p>
            <button type="button" onClick={onClose}>
              Return to the journey
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
