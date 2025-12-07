import React, { useRef } from 'react';
import CardCredits from '../card_credits.jsx';

export default function CreditsPanel({
  libraries = [],
  disabledFloaters = false,
}) {
  const creditsRef = useRef(null);

  return (
    <section className="flex h-full items-center justify-center">
      <div
        ref={creditsRef}
        className="relative w-full max-w-xl min-h-[60vh]"
      >
        <CardCredits />
      </div>
    </section>
  );
}
