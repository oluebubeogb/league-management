export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="container-app prose prose-slate max-w-3xl py-8">
      <h1 className="text-2xl font-bold">Privacy notice</h1>
      <p className="mt-4 text-sm text-slate-600">
        League Management collects only the data needed to run the competition platform: username,
        phone number, password hash, and year of birth (for account recovery). Phone numbers and
        birth years are never shown publicly. Player phone numbers collected for team management
        are visible only to authorised administrators.
      </p>
      <p className="mt-3 text-sm text-slate-600">
        Predictions and comments are public under your username only. We do not sell personal data.
        Session cookies are HttpOnly and used solely for authentication. For questions, contact the
        league organisers.
      </p>
    </div>
  );
}
