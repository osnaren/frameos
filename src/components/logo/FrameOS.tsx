import React from 'react';

interface FrameOSProps {
  frameRef: React.RefObject<SVGPathElement>;
  textGroupRef?: React.RefObject<SVGGElement>;
  width?: number;
  height?: number;
  className?: string;
  fontSize?: number;
}

const FrameOS: React.FC<FrameOSProps> = ({
  frameRef,
  textGroupRef = null,
  width = 120, // Default width
  height = 120, // Default height
  className = '',
  fontSize = 72, // Default font size
}) => {
  return (
    <svg
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      fill="none"
      width={width}
      height={height}
      className={className}
      aria-label="FrameOS logo"
      role="img"
    >
      <path
        id="Frame-Box"
        d="M430,265.28v-10.01h0V70H70v360h360v-92.95"
        className="fill-none stroke-current frame-box"
        style={{ strokeMiterlimit: 10, strokeWidth: '7px' }}
        ref={frameRef}
      />
      <g id="Text_Group" ref={textGroupRef}>
        <text
          id="Text-Frame"
          transform="translate(84 327) scale(.93 1)"
          className="font-lato font-black tracking-[.14em] fill-[var(--color-text)] text-frame"
          style={{ fontSize: `${fontSize}px` }}
        >
          <tspan x="0" y="0">
            FRAME
          </tspan>
        </text>
        <text
          id="Text-OS"
          transform="translate(365.05 327)"
          className="font-lato font-extrabold tracking-[.14em] stroke-[var(--color-text)] stroke-[4] fill-none text-os "
          style={{ fontSize: `${fontSize}px`, strokeMiterlimit: 10 }}
        >
          <tspan x="0" y="0">
            OS
          </tspan>
        </text>
      </g>
    </svg>
  );
};

export default FrameOS;
