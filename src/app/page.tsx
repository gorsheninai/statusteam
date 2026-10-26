import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import PulseRule from "@/components/ui/PulseRule";
import Motion from "@/motion/Motion";
import SmoothScroll from "@/motion/SmoothScroll";
import Cursor from "@/motion/Cursor";
import MobileScreenSwipe from "@/motion/MobileScreenSwipe";
import Hero from "@/sections/hero/Hero";
import StatusTeamScene from "@/sections/status-team/StatusTeamScene";
import PulseSection from "@/sections/pulse/PulseSection";
import ExperienceSection from "@/sections/experience/ExperienceSection";
import TicketsSection from "@/sections/tickets/TicketsSection";
import JoinSection from "@/sections/join/JoinSection";
import FaqSection from "@/sections/faq/FaqSection";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Motion />
      <Cursor />
      <Nav />
      <MobileScreenSwipe />
      <div className="bg-field" data-bg-field aria-hidden="true" />
      <main id="top">
        <Hero />
        <PulseRule />
        <StatusTeamScene />
        <PulseSection />
        <PulseRule />
        <ExperienceSection />
        <TicketsSection />
        <PulseRule />
        <JoinSection />
        <FaqSection />
      </main>
      <Footer />
    </>
  );
}
