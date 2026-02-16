import { UUID } from "../../shared/types";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Menu, Plus, MessageSquare } from "lucide-react";

type ConversationsListProps = {
  activeSessionId: UUID | null;
  drawerOpen: boolean;
  handleSelectConversation: (id: UUID) => void;
  setDrawerOpen: (value: boolean) => void;
  handleNewConversation: () => void;
  conversationIds: UUID[];
  setConversationIds: (value: UUID[]) => void;
};

export function ConversationsList({
  activeSessionId,
  drawerOpen,
  handleSelectConversation,
  setDrawerOpen,
  handleNewConversation,
  conversationIds,
  setConversationIds,
}: ConversationsListProps) {
  return (
    <div>
      <Drawer direction="left" open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="size-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Conversations</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <Button className="w-full mb-4" onClick={handleNewConversation}>
              <Plus className="size-4 mr-2" />
              New conversation
            </Button>
            <div className="space-y-1">
              {conversationIds.map((id) => (
                <button
                  key={id}
                  onClick={() => handleSelectConversation(id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-accent ${id === activeSessionId ? "bg-accent" : ""}`}
                >
                  <MessageSquare className="size-4 shrink-0" />
                  <span className="truncate">{id.slice(0, 8)}...</span>
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
