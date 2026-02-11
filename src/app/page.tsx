import Header from "@/components/Header";
import GameEmbed from "@/components/GameEmbed";
import SidePanel from "@/components/SidePanel";
import StatsBar from "@/components/StatsBar";

export default function Home() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Game embed */}
          <div className="flex-1 overflow-hidden">
            <GameEmbed />
          </div>

          {/* Stats bar */}
          <StatsBar />
        </div>

        {/* Right side panel */}
        <div className="w-[380px] shrink-0 hidden lg:flex">
          <SidePanel />
        </div>
      </div>
    </div>
  );
}
