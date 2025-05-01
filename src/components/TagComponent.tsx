import { useState, useRef } from "react";

const TagComponent = ({ tags }: { tags: any[] }) => {
  const [tag, setTag] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle Grab Scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;

    const startX = e.clientX;
    const scrollLeft = scrollContainerRef.current.scrollLeft;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = startX - e.clientX;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollLeft + diff;
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div style={{ position: 'relative', height: 'fit-content' }}>
      <span className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white via-transparent to-transparent z-10 pointer-events-none"></span>

      <div
        className="mb-4 flex gap-2 overflow-x-auto relative"
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        style={{
          cursor: "grab",
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Konten tags */}
        {tags.map((t: any, i) => (
          <button
            key={i}
            className="bg-gray border cursor-pointer border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-200"
            onClick={() => setTag(t.name)}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagComponent;
