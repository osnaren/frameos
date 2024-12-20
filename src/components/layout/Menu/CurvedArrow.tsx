import React from 'react';

interface CurvedArrowProps {
  arrowRef: React.RefObject<SVGPathElement>;
  width: number;
  height: number;
  className?: string;
}

const CurvedArrow = ({ arrowRef, width, height, className = '' }: CurvedArrowProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      fill="none"
      width={width}
      height={height}
      className={className}
    >
      <g transform="translate(-631.57 -155.76)">
        <path
          ref={arrowRef}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d="m933.91 498.887-29.824-22.41c-.836-.63-2.016-.493-2.715.304-.723.832-.598 2.11.234 2.828l22.895 19.47c-19.617-3.056-38.594-10.212-55.188-20.997-2.234-1.527-4.546-3.008-6.66-4.66l-3.238-2.445c-1.082-.868-2.129-1.711-3.176-2.555-4.199-3.438-8.297-7.05-12.062-10.91-7.645-7.684-14.223-16.387-19.395-25.864-5.172-9.476-8.789-19.738-10.761-30.351-.493-2.64-.903-5.332-1.223-8.016-.32-2.683-.547-5.363-.66-8.074-.133-2.676-.153-5.379-.117-8.098.07-2.699.18-5.379.437-8.066.117-1.281.246-2.504.453-3.777a51.73 51.73 0 0 0 7.024 2.949 52.517 52.517 0 0 0 12.113 2.52c4.11.355 8.285.265 12.445-.462 4.102-.71 8.258-2.011 12.02-4.214.445-.274.91-.582 1.379-.891.464-.309.894-.637 1.359-.945.43-.328.879-.692 1.273-1.043.2-.176.395-.348.59-.524l.594-.523a32.399 32.399 0 0 0 4.242-4.86c2.504-3.507 4.32-7.652 4.946-12.054l.171-1.63c.02-.276.036-.558.032-.8.02-.277.015-.52.03-.8a28.7 28.7 0 0 0-.151-3.31 25.597 25.597 0 0 0-.633-3.3 21.784 21.784 0 0 0-1.13-3.2c-.25-.48-.456-1.03-.8-1.519l-.437-.734-.461-.696-.22-.367-.276-.351-.516-.684c-.172-.2-.363-.453-.535-.648l-.598-.633a19.227 19.227 0 0 0-5.453-3.918c-3.973-2.004-8.305-2.727-12.39-2.871l.034.02c-.125-.028-.277-.016-.218-.032l-.149.008-.3.02-.579.003c-.39.016-.78.032-1.136.063-.395.015-.75.05-1.106.086-.355.035-.746.05-1.125.12-.73.106-1.465.212-2.219.356-.714.16-1.449.266-2.148.489a37.124 37.124 0 0 0-8.293 3.148c-.633.352-1.293.742-1.926 1.098l-1.898 1.21-1.797 1.368-1.676 1.488c-2.191 2.05-4.027 4.406-5.594 6.867-1.566 2.461-2.878 5.07-3.992 7.746a62.793 62.793 0 0 0-2.73 8.137c-.223.879-.465 1.797-.688 2.68l-.246-.238c-.316-.278-.672-.579-.969-.895-.593-.633-1.246-1.25-1.816-1.918a14.148 14.148 0 0 0-.871-.98l-.793-1.036c-.277-.351-.496-.718-.773-1.07-.254-.39-.497-.723-.75-1.11-.477-.753-.973-1.472-1.368-2.28-.894-1.524-1.632-3.153-2.312-4.797-1.344-3.32-2.3-6.809-2.942-10.352-1.406-7.113-1.289-14.543-.082-21.781 1.207-7.238 3.485-14.34 6.633-21.035l.02-.036.02-.035c.929-2.11 0-4.57-2.044-5.507-2.14-.95-4.597-.012-5.527 2.097-3.356 7.39-5.773 15.227-7.008 23.266-1.203 8.058-1.246 16.351.27 24.441a60.3 60.3 0 0 0 3.554 11.863c.871 1.895 1.743 3.793 2.805 5.61.52.926 1.082 1.777 1.66 2.687.27.446.598.875.887 1.282.328.43.598.875.945 1.27l1.004 1.253c.348.39.695.785 1.047 1.18.695.785 1.469 1.52 2.223 2.293.367.355.793.699 1.164 1.054l.597.54.621.503 1.243 1.004 1.125.793a83.394 83.394 0 0 0-.649 6.024c-.226 2.8-.304 5.593-.347 8.406.015 2.797.066 5.617.23 8.402.164 2.79.422 5.582.828 8.367a154.21 154.21 0 0 0 1.356 8.282 106.753 106.753 0 0 0 11.609 31.375c5.488 9.754 12.434 18.574 20.352 26.367 3.93 3.902 8.156 7.547 12.507 10.969 1.082.867 2.184 1.695 3.29 2.527l3.386 2.434c2.207 1.66 4.574 3.125 6.899 4.66 17.117 10.793 36.53 17.77 56.515 20.605l-28.601 11.426c-.992.39-1.489 1.496-1.157 2.504.344 1.066 1.465 1.617 2.528 1.27L933 504.37c.586-.187 1.094-.57 1.48-1.07 1.04-1.465.801-3.383-.57-4.414ZM821.578 338.965c1.434-2.156 3.008-4.133 4.863-5.852l1.414-1.203 1.5-1.105 1.586-1.004 1.676-.91c2.25-1.153 4.645-1.98 7.137-2.563.625-.168 1.246-.242 1.867-.41.64-.113 1.262-.188 1.879-.266.32-.054.621-.074.918-.093.3-.02.621-.075.953-.075.3-.02.637-.02.934-.039l.43.008.183.012.094.004a5.194 5.194 0 0 1-.535-.07c-.258-.051-.473-.176-.653-.282l1.258.395c.93.054 1.8.12 2.684.25l1.328.187c.422.102.867.164 1.289.266 1.687.394 3.293.937 4.75 1.73 2.926 1.496 5.199 3.868 6.492 6.778 1.293 2.91 1.547 6.375 1.043 9.738-.5 3.273-1.941 6.43-3.969 9.203-1.035 1.375-2.176 2.688-3.476 3.86l-.493.437a3.544 3.544 0 0 0-.492.437c-.332.243-.648.54-.98.782-.328.242-.66.48-1.028.703-.367.222-.734.441-1.101.664-2.953 1.707-6.367 2.719-9.844 3.262-3.496.574-7.144.586-10.715.207-3.59-.34-7.133-1.184-10.543-2.336a42.072 42.072 0 0 1-7.976-3.785c.355-1.528.71-3.055 1.156-4.579.75-2.546 1.574-5.05 2.637-7.468 1.117-2.434 2.297-4.73 3.734-6.883Zm25.434-13.496c.035.02.035.02 0 0Zm0 0"
        />
      </g>
    </svg>
  );
};

export default CurvedArrow;