import React, { useRef } from 'react';
import Floaters from '../floaters.jsx';
import CardHome from '../card_home.jsx';

export default function HomePanel({
  libraries = [],
  disabledFloaters = false,
  onSelectFocus = () => {},
}) {
  const homeRef = useRef(null);

  return (
    <section className="w-full flex items-center justify-center py-8">
      <div
        ref={homeRef}
        className="relative mx-auto flex w-full max-w-[1000px] min-h-[60vh] items-center justify-center"
      >
        <Floaters
          skills={libraries}
          containerRef={homeRef}
          maxItems={20}
          disabled={disabledFloaters}
          speedMin={7}
          speedMax={18}
          slow={1}
          margin={40}
        />
        <CardHome className="w-full" onSelectFocus={onSelectFocus} />
      </div>
    </section>
  );
}
