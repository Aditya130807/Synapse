import { ChatProvider } from './context/chatContext';
import { NavigationRail } from '@/components/sidebar/NavigationRail';
import { ConversationSidebar } from './components/ConversationSidebar';
import { ConversationWorkspace } from './components/ConversationWorkspace';

export default function ChatPage() {
  return (
    <ChatProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#030712] text-foreground antialiased">
        {/* Far Left: Expandable Navigation Rail (72px -> 260px on hover) */}
        <NavigationRail />

        {/* Middle Panel: Conversation Sidebar (280px on desktop) */}
        <div className="w-72 shrink-0 hidden md:block h-full">
          <ConversationSidebar />
        </div>

        {/* Right Panel: Main Chat Workspace */}
        <div className="flex-1 h-full min-w-0">
          <ConversationWorkspace />
        </div>
      </div>
    </ChatProvider>
  );
}
