"use client";

import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { PlaygroundState } from "@/data/playground-state";
import { usePlaygroundState } from "./use-playground-state";
import { VoiceId } from "@/data/voices";
import { getUrlParams } from "@/components/configuration-form";
export type ConnectFn = () => Promise<void>;

type TokenGeneratorData = {
  isConnecting: boolean
  shouldConnect: boolean;
  wsUrl: string;
  token: string;
  pgState: PlaygroundState;
  voice: VoiceId;
  disconnect: () => Promise<void>;
  connect: ConnectFn;
};

const ConnectionContext = createContext<TokenGeneratorData | undefined>(
  undefined,
);

export const ConnectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [connectionDetails, setConnectionDetails] = useState<{
    wsUrl: string;
    token: string;
    shouldConnect: boolean;
    voice: VoiceId;
  }>({ wsUrl: "", token: "", shouldConnect: false, voice: VoiceId.PUCK });
const [isConnecting, setIsConnecting] = useState(false);
  const { pgState } = usePlaygroundState();
const [hasAutoConnected, setHasAutoConnected] = useState(false);
  const BASE_URL = "https://apiv7.goqii.com/";

// Function to get headers from URL parameters
function getHeaders() {
  const params = new URLSearchParams(window.location.search); // Or pass params as an argument if not in a browser environment
return {
    "Content-Type": "application/json",
    "h-goqiiuserid": params.get("goqiiUserId") || params.get("goqiiuserid") || "",
    "h-nonce": params.get("nonce") || params.get("Nonce") || "",
    "h-signature": params.get("signature") || params.get("Signature") || "",
    "h-apikey": params.get("apiKey") || params.get("apikey") || "",
    "h-goqiiaccesstoken": params.get("goqiiAccessToken") || params.get("goqiiaccesstoken") || "",
    "h-appversion": params.get("appVersion") || params.get("AppVersion") || "",
    "h-apptype":  params.get("appType") || params.get("AppType") || "",
    }
}

/**
 * Fetches user's orders.
 * @param {string} pageId - The page ID for pagination. Defaults to "1".
 * @returns {Promise<object|null>} A promise that resolves to the JSON response or null on error.
 */
async function fetchMyOrders(pageId = "1") {
  try {
    const headers = getHeaders();
    const response = await fetch(BASE_URL + "store/fetch_my_orders_v2", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ pageId: pageId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data; // Return the parsed JSON object
  } catch (e) {
    console.error("Error fetching orders:", e);
    return null;
  }
}

/**
 * Fetches 7-day food data.
 * @returns {Promise<object|null>} A promise that resolves to the JSON response or null on error.
 */
async function fetch7DayFoodData() {
  try {
    const headers = getHeaders();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Format date as "DD-MM-YYYY"
    const day = String(sevenDaysAgo.getDate()).padStart(2, "0");
    const month = String(sevenDaysAgo.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = sevenDaysAgo.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    const body = { dataInDepth: "10", date: formattedDate };

    const response = await fetch(BASE_URL + "food/fetch_by_range", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data; // Return the parsed JSON object
  } catch (e) {
    console.error("Error fetching 7-day food data:", e);
    return null;
  }
}
  const connect = useCallback(async () => {
    // Prevents re-connection if already in progress
    if (isConnecting) {
      return;
    }

    setIsConnecting(true);
    pgState.geminiAPIKey = JSON.stringify(getUrlParams());
    // console.log(pgState)
    fetchMyOrders("1").then(async (dataOrder) => { // <--- Added 'async' here
      if (dataOrder) {
        
        fetch7DayFoodData().then(async (dataFood) => { // <--- Added 'async' here
          if (dataFood) {
            const value = pgState.instructions;
            let combined = (
                value + // data.get("instructions", "") becomes data.instructions || ""
                "\n\nHere is the user's order details for reference:\n" +
                JSON.stringify(dataOrder) +
                "\n\nHere is the user's food log data for the last 7 days. " +
                "Analyze this data and provide nutrition and habit analysis, including " +
                "what the user is doing right, what they are doing wrong, and what they can improve:\n" +
                JSON.stringify(dataFood)
            );

            //Idhar dalo API_Key
            pgState.api_key = "AIzaSyDdjpu0imnlYmGLBLEmd4gs0RwuutL4dBg"
            pgState.instructions = JSON.stringify(combined)
            console.log("My Orders:", pgState.instructions);
            if (!pgState.geminiAPIKey) {
              throw new Error("Gemini API key is required to connect");
            }
            const response = await fetch("/api/token", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(pgState),
            });

            if (!response.ok) {
              throw new Error("Failed to fetch token");
            }

            const { accessToken, url } = await response.json();

            setConnectionDetails({
              wsUrl: url,
              token: accessToken,
              shouldConnect: true,
              voice: pgState.sessionConfig.voice,
            });
          }
         })
       }
      })

  }, [isConnecting, pgState]);

const disconnect = useCallback(async () => {
  setIsConnecting(false); // Add this line to reset the connecting state immediately
  setConnectionDetails((prev) => ({ ...prev, shouldConnect: false }));
}, []);
useEffect(() => {
  // Only run the automatic connection once on the initial load.
  if (!hasAutoConnected) {
    connect();
    setHasAutoConnected(true);
  }
}, [connect, hasAutoConnected]);
  // Effect to handle API key changes
  useEffect(() => {
    if (pgState.geminiAPIKey === null && connectionDetails.shouldConnect) {
      disconnect();
    }
  }, [pgState.geminiAPIKey, connectionDetails.shouldConnect, disconnect]);

  return (
    <ConnectionContext.Provider
      value={{
        isConnecting,
        wsUrl: connectionDetails.wsUrl,
        token: connectionDetails.token,
        shouldConnect: connectionDetails.shouldConnect,
        voice: connectionDetails.voice,
        pgState,
        connect,
        disconnect,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);

  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }

  return context;
};
