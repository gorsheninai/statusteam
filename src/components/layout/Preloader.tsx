import { PULSE_PATH } from "@/lib/pulse-path";

const PRELOAD_ONCE = `try{if(sessionStorage.getItem('st-seen')){document.documentElement.classList.add('no-preload')}else{sessionStorage.setItem('st-seen','1')}}catch(e){}`;

export default function Preloader() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PRELOAD_ONCE }} />
        <div className="preloader" aria-hidden="true">
          <span className="curtain curtain-l" />
          <span className="curtain curtain-r" />
          <svg
            className="preloader-line"
            viewBox="0 0 1200 40"
            preserveAspectRatio="none"
            focusable="false"
          >
            <path d={PULSE_PATH} pathLength={1} />
          </svg>
        </div>
    </>
  );
}
