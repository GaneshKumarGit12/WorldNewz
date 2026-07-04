import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "../api/apiClient";

let connection: signalR.HubConnection | null = null;

export const getPollsHubConnection = (): signalR.HubConnection => {
  if (!connection) {
    const hubUrl = API_BASE_URL.replace(/\/api$/, "") + "/hubs/polls";
    connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return connection;
};

export const startPollsSignalR = async (onPollUpdated: (data: any) => void) => {
  const conn = getPollsHubConnection();

  conn.off("PollUpdated");
  conn.on("PollUpdated", (data: any) => {
    onPollUpdated(data);
  });

  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await conn.start();
      console.log("⚡ SignalR PollsHub connected successfully.");
    } catch (err) {
      console.warn("⚠️ SignalR PollsHub connection error (polling fallback):", err);
    }
  }
};

export const stopPollsSignalR = async () => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    try {
      await connection.stop();
    } catch (err) {
      console.warn("SignalR disconnect error:", err);
    }
  }
};
