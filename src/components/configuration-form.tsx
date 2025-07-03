"use client";

import { useEffect, useCallback, useRef, useState } from "react"; // Added useState
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useConnectionState,
  useLocalParticipant,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { RotateCcw } from "lucide-react";

import { Form } from "@/components/ui/form";
import { SessionConfig } from "@/components/session-config";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useConnection } from "@/hooks/use-connection";
import { usePlaygroundState } from "@/hooks/use-playground-state";

import { VoiceId } from "@/data/voices";
import { ModelId } from "@/data/models";
import { ModalitiesId } from "@/data/modalities";
import { defaultSessionConfig } from "@/data/playground-state";

// The Zod schema remains unchanged.
export const ConfigurationFormSchema = z.object({
  model: z.nativeEnum(ModelId),
  modalities: z.nativeEnum(ModalitiesId),
  voice: z.nativeEnum(VoiceId),
  temperature: z.number().min(0.6).max(1.2),
  maxOutputTokens: z.number().nullable(),
});

export interface ConfigurationFormFieldProps {
  form: UseFormReturn<z.infer<typeof ConfigurationFormSchema>>;
  schema?: typeof ConfigurationFormSchema;
}

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

  export function getUrlParams(): string {
    // Return an empty JSON object if not in a browser environment (e.g., during SSR)
    if (typeof window === "undefined") {
      return JSON.stringify({});
    }

    const params = new URLSearchParams(window.location.search);
    const value = {
      goqiiUserId: params.get("goqiiUserId") || params.get("goqiiuserid") || "",
      nonce: params.get("nonce") || params.get("Nonce") || "",
      signature: params.get("signature") || params.get("Signature") || "",
      apiKey: params.get("apiKey") || params.get("apikey") || "",
      goqiiAccessToken:
        params.get("goqiiAccessToken") || params.get("goqiiaccesstoken") || "",
      pagination: params.get("pagination") || params.get("Pagination") || "",
      appVersion: params.get("appVersion") || params.get("AppVersion") || "",
      appType: params.get("appType") || params.get("AppType") || "",
      goqiiCoachId:
        params.get("goqiiCoachId") || params.get("goqiicoachid") || "",
    };
    return JSON.stringify(value);
  }
export function ConfigurationForm() {
  const { pgState, dispatch } = usePlaygroundState();
  const connectionState = useConnectionState();
  const { voice, disconnect, connect } = useConnection();
  const { localParticipant } = useLocalParticipant();
  const { toast } = useToast();
  const { agent } = useVoiceAssistant();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof ConfigurationFormSchema>>({
    resolver: zodResolver(ConfigurationFormSchema),
    defaultValues: { ...defaultSessionConfig },
    mode: "onChange",
  });
  const formValues = form.watch();


  // 3. `updateConfig` function is updated to include the URL parameters.
  const updateConfig = useCallback(async () => {
    if (!localParticipant || !agent?.identity) {
      return;
    }
    const values = pgState.sessionConfig;

    // The 'attributes' object now merges the form config with the URL params.
    const attributes: { [key: string]: string } = {
      // Attributes from your existing global state
      gemini_api_key: getUrlParams() || "",
      instructions: pgState.instructions,
      voice: values.voice,
      modalities: values.modalities,
      temperature: values.temperature.toString(),
      max_output_tokens: values.maxOutputTokens
        ? values.maxOutputTokens.toString()
        : "",
      api_key:""
    };
  
    const hadExistingAttributes =
      Object.keys(localParticipant.attributes).length > 0;

    const onlyVoiceChanged = Object.keys(attributes).every(
      (key) =>
        key === "voice" ||
        attributes[key] === (localParticipant.attributes[key] as string)
    );

    if (onlyVoiceChanged && hadExistingAttributes) {
      return;
    }

    try {
      let response = await localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: "pg.updateConfig",
        payload: JSON.stringify(attributes),
      });
      console.log("pg.updateConfig", response);
      let responseObj = JSON.parse(response as string);
      if (responseObj.changed) {
        // toast({
        //   title: "Configuration Updated",
        //   description: "Your changes have been applied successfully.",
        //   variant: "success",
        // });
      }
    } catch (e) {
      // console.error("Error updating configuration:", e);
      // toast({
      //   title: "Error Updating Configuration",
      //   description:
      //     "There was an error updating your configuration. Please try again.",
      //   variant: "destructive",
      // });
    }
  }, [
  localParticipant,
  agent,
  pgState.sessionConfig,
  pgState.instructions,
  ]);
  const handleDebouncedUpdate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      updateConfig();
    }, 500);
  }, [updateConfig]);

  useEffect(() => {
    if (form.formState.isValid && form.formState.isDirty) {
      dispatch({
        type: "SET_SESSION_CONFIG",
        payload: formValues,
      });
    }
  }, [formValues, dispatch, form.formState.isDirty, form.formState.isValid]); // Corrected dependencies

  useEffect(() => {
    if (ConnectionState.Connected === connectionState) {
      handleDebouncedUpdate();
    }
    form.reset(pgState.sessionConfig);
  }, [pgState.sessionConfig, connectionState, handleDebouncedUpdate, form]);

  return (
    <Form {...form}>
      <form className="h-full">
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 py-4 px-1">
            <div className="text-xs font-semibold uppercase tracking-widest">
              Configuration
            </div>
          </div>
          <div className="flex-grow overflow-y-auto py-4 pt-0">
            <div className="space-y-4">
              <SessionConfig form={form} />
              {pgState.sessionConfig.voice !== voice &&
                ConnectionState.Connected === connectionState && (
                  <div className="flex flex-col">
                    <div className="text-xs my-2">
                      Your change to the voice parameter requires a reconnect.
                    </div>
                    <div className="flex w-full">
                      <Button
                        className="flex-1"
                        type="button"
                        variant="primary"
                        onClick={() => {
                          disconnect().then(() => {
                            connect();
                          });
                        }}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" /> Reconnect Now
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
