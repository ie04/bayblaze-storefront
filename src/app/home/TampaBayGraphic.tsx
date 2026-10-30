export default function TampaBayGraphic() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 560 160"
      fill="none"
      className="pointer-events-none absolute inset-x-6 bottom-4 -z-10 block h-auto max-h-28 w-[calc(100%-3rem)] text-[var(--ast-global-color-1)] opacity-70 sm:inset-x-8 sm:w-[calc(100%-4rem)] lg:inset-x-10 lg:w-[calc(100%-5rem)]"
    >
      <circle cx="425" cy="38" r="24" fill="currentColor" opacity="0.06" />
      <path
        d="M401 38a24 24 0 0 1 48 0"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.35"
      />

      <g stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.55">
        {/* A quiet waterfront silhouette, with stepped towers and a sloping roof. */}
        <path d="M14 111h23V87h20v24m0 0V66h25v45m0 0V46h7v-9h15v9h7v65m0 0V73h24v38m0 0V28l33 17v66m0 0V60h10v-8h18v8h10v51m0 0V84h24v27h29" />
        <path d="M93 57v39m7-39v39m44-45v45m8-41v41m30-23v23m10-23v23" opacity="0.3" />

        {/* Cable-stayed bridge over the bay. */}
        <path d="M285 106h255M347 71v49m126-49v49" />
        <path d="m300 106 47-35 47 35m32 0 47-35 47 35M322 106l25-35 25 35m76 0 25-35 25 35" opacity="0.6" />
        <path d="M265 120h36m221 0h24" opacity="0.35" />
      </g>

      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.18">
        <path d="M19 126h152m20 0h45m94 5h106M60 139h57m20 0h141m187-2h49M224 150h67m-245 0h23" />
      </g>
    </svg>
  );
}
