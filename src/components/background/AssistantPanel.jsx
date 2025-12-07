import React, { useRef } from 'react';
import Floaters from '../floaters.jsx';
import ChatWidget from '../chatbot/ChatWidget.jsx';

export default function AssistantPanel({
  libraries = [],
  disabledFloaters = false,
}) {
  const chatRef = useRef(null);

  return (
    <section className="w-full">
      <div
        ref={chatRef}
        className="relative mx-auto flex w-full max-w-[900px] min-h-[60vh] items-center justify-center"
      >
        <Floaters
          skills={libraries}
          containerRef={chatRef}
          maxItems={18}
          disabled={disabledFloaters}
          speedMin={6}
          speedMax={14}
          slow={1}
          margin={30}
        />
        <ChatWidget className="relative z-10" />
      </div>
    </section>
  );
}
