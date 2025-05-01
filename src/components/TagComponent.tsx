import { useRef } from "react";

const TagComponent = ({
  tags,
  onSelectTag,
}: {
  tags: any[];
  onSelectTag: (tag: string) => void;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const isLoading = tags.length === 0;

  return (
    <div style={{ position: "relative", height: "fit-content" }}>
      <span className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white via-transparent to-transparent z-10"></span>

      <div
        className="px-3 md:px-0 mb-4 flex gap-2 sm:pr-8 md:pr-8 overflow-x-auto relative"
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        style={{
          cursor: "grab",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`loading-${i}`}
                className="bg-gray-100 animate-pulse border border-dashed border-gray-300 px-3 py-1 rounded-lg w-20 h-8"
              />
            ))
          : tags.map((t: any, i) => (
              <button
                key={`tag-${i}`}
                className="bg-gray border cursor-pointer border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-100"
                onClick={() => onSelectTag(t.name)}
              >
                {t.name}
              </button>
            ))}
      </div>
    </div>
  );
};

export default TagComponent;
