"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useConnection } from "@/hooks/use-connection";
import { Loader2 } from "lucide-react";
import { usePlaygroundState } from "@/hooks/use-playground-state";
import { AuthDialog } from "./auth";

export function ConnectButton() {
  // const { connect, disconnect, shouldConnect } = useConnection();
  const { connect, disconnect, shouldConnect, isConnecting } = useConnection();
  const { pgState } = usePlaygroundState();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [initiateConnectionFlag, setInitiateConnectionFlag] = useState(false);

  const handleConnectionToggle = async () => {
    if (shouldConnect) {
      await disconnect();
    } else {
        await connect(); // Directly call the guarded connect function
    }
  };

  const initiateConnection = useCallback(async () => {
      await connect();
  }, [connect]);

  const handleAuthComplete = () => {
    setShowAuthDialog(false);
    setInitiateConnectionFlag(true);
  };

  useEffect(() => {
    if (initiateConnectionFlag && pgState.geminiAPIKey) {
      initiateConnection();
      setInitiateConnectionFlag(false);
    }
  }, [initiateConnectionFlag, initiateConnection, pgState.geminiAPIKey]);

  return (
    <>
      <Button
        onClick={handleConnectionToggle}
        disabled={isConnecting || shouldConnect} // Use global state
        className="text-sm font-semibold bg-[#35b400] text-white rounded-xl shadow-none"
      >
        {isConnecting || shouldConnect ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isConnecting ? "Connecting" : "Connected"} 
          </>
        ) : (
          "Connect"
        )}
      </Button>
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onAuthComplete={handleAuthComplete}
      />
    </>
  );
}
